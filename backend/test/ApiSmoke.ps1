$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$data = Join-Path ([IO.Path]::GetTempPath()) ("drop-api-smoke-" + [guid]::NewGuid().ToString('N'))
$env:DROP_DATA_DIR = $data
$env:PORT = '8099'
$env:DROP_API_PORT = '8099'
$env:DROP_ADMIN_EMAIL = 'admin@drop.local'
$env:DROP_ADMIN_PASSWORD = 'DropAdmin!2026'
New-Item -ItemType Directory -Force (Join-Path $root 'backend\out') | Out-Null
Get-ChildItem (Join-Path $root 'backend\src') -Recurse -Filter '*.java' | ForEach-Object FullName | Set-Content -Encoding ascii (Join-Path $root 'backend\sources.txt')
javac -encoding UTF-8 -d (Join-Path $root 'backend\out') ('@' + (Join-Path $root 'backend\sources.txt'))
if ($LASTEXITCODE -ne 0) { throw 'Backend compilation failed.' }
$serverOut = Join-Path ([IO.Path]::GetTempPath()) ("drop-api-smoke-" + [guid]::NewGuid().ToString('N') + '.out.log')
$serverErr = Join-Path ([IO.Path]::GetTempPath()) ("drop-api-smoke-" + [guid]::NewGuid().ToString('N') + '.err.log')
$viteOut = Join-Path ([IO.Path]::GetTempPath()) ("drop-api-smoke-vite-" + [guid]::NewGuid().ToString('N') + '.out.log')
$viteErr = Join-Path ([IO.Path]::GetTempPath()) ("drop-api-smoke-vite-" + [guid]::NewGuid().ToString('N') + '.err.log')
$javaArgs = '-cp "' + (Join-Path $root 'backend\out') + '" com.drop.server.DropServer'
$server = Start-Process -FilePath 'java' -ArgumentList $javaArgs -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr -PassThru
$vite = $null
function CallApi([string]$method, [string]$path, [object]$body = $null, [string]$token = '') {
  $headers = @{}; if ($token) { $headers.Authorization = "Bearer $token" }
  $args = @{ Uri = "http://localhost:8099$path"; Method = $method; Headers = $headers; TimeoutSec = 40 }
  if ($null -ne $body) { $args.ContentType = 'application/json'; $args.Body = ($body | ConvertTo-Json -Depth 20 -Compress) }
  Invoke-RestMethod @args
}
function Check([bool]$condition, [string]$message) { if (-not $condition) { throw "FAIL: $message" }; Write-Output "PASS: $message" }
try {
  $ready = $false
  for ($i = 0; $i -lt 40; $i++) { try { $health = CallApi GET '/api/health'; $ready = $true; break } catch { Start-Sleep -Milliseconds 250 } }
  if (-not $ready) { if (Test-Path $serverErr) { Get-Content $serverErr }; throw 'Core Java API did not start.' }
  Check $ready 'Core Java API health endpoint'
  if (-not (Test-Path (Join-Path $root 'node_modules\vite\bin\vite.js'))) { throw 'Install frontend dependencies with npm install before running the API smoke script.' }
  $viteScript = '"' + (Join-Path $root 'node_modules\vite\bin\vite.js') + '"'
  $vite = Start-Process -FilePath 'node' -ArgumentList @($viteScript, '--host', '127.0.0.1', '--port', '5199', '--strictPort') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $viteOut -RedirectStandardError $viteErr -PassThru
  $proxyReady = $false
  for ($i = 0; $i -lt 80; $i++) { try { $proxied = Invoke-RestMethod -Uri 'http://127.0.0.1:5199/api/health' -TimeoutSec 5; if ($proxied.status -eq 'ok') { $proxyReady = $true; break } } catch { Start-Sleep -Milliseconds 250 } }
  if (-not $proxyReady) { if (Test-Path $viteErr) { Get-Content $viteErr }; throw 'Vite API proxy did not reach the Java backend.' }
  Check $proxyReady 'Vite /api proxy reaches the Java backend'
  Add-Type -AssemblyName System.Net.Http
  $corsRequest = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Options, 'http://localhost:8099/api/auth/me')
  [void]$corsRequest.Headers.TryAddWithoutValidation('Origin','http://localhost:5173')
  [void]$corsRequest.Headers.TryAddWithoutValidation('Access-Control-Request-Method','GET')
  [void]$corsRequest.Headers.TryAddWithoutValidation('Access-Control-Request-Headers','authorization,content-type')
  $httpClient = [System.Net.Http.HttpClient]::new()
  $cors = $httpClient.SendAsync($corsRequest).GetAwaiter().GetResult()
  Check ($cors.StatusCode -eq [System.Net.HttpStatusCode]::NoContent -and $cors.Headers.Contains('Access-Control-Allow-Headers')) 'CORS preflight supports bearer auth'
  $httpClient.Dispose(); $corsRequest.Dispose(); $cors.Dispose()
  $owner = CallApi POST '/api/auth/register' @{ name='Smoke Owner'; email='owner-smoke@example.test'; password='OwnerPass123'; role='OWNER' }
  Check ($owner.user.role -eq 'OWNER') 'Owner registration and session token'
  Check ((CallApi GET '/api/venues/mine' $null $owner.token).Count -eq 0) 'Owner listings are scoped to this account'
  $listing = CallApi POST '/api/venues' @{ name='Smoke Test Studio'; category='Studio'; locality='Bandra'; unitLabel='Studio'; areaSqft=800; capacity=50; hourlyRate=2000; description='API workflow verification venue'; contactPhone=''; amenities=@('Wi-Fi') } $owner.token
  Check ($listing.status -eq 'PENDING' -and $listing.dataLabel -eq 'OWNER_SUBMITTED') 'Owner listing created pending review'
  $otherOwner = CallApi POST '/api/auth/register' @{ name='Other Owner'; email='other-owner-smoke@example.test'; password='OtherPass123'; role='OWNER' }
  $otherMine = CallApi GET '/api/venues/mine' $null $otherOwner.token
  Check ($null -eq $otherMine -or ($otherMine -is [array] -and $otherMine.Length -eq 0)) 'Owners cannot see another account listings'
  $admin = CallApi POST '/api/auth/login' @{ email='admin@drop.local'; password='DropAdmin!2026' }
  $pending = CallApi GET '/api/admin/venues/pending' $null $admin.token
  $found = @($pending | Where-Object id -eq $listing.id).Count -eq 1
  Check $found 'Admin can see the pending owner listing'
  CallApi PATCH "/api/admin/venues/$($listing.id)/approve" $null $admin.token | Out-Null
  $customer = CallApi POST '/api/auth/register' @{ name='Smoke Customer'; email='customer-smoke@example.test'; password='CustomerPass123'; role='CUSTOMER' }
  $tomorrow = (Get-Date).Date.AddDays(1).ToString('yyyy-MM-dd')
  $visible = CallApi GET '/api/venues' $null $customer.token
  Check (@($visible | Where-Object id -eq $listing.id).Count -eq 1) 'Approved owner listing is publicly searchable'
  $eventStart = "${tomorrow}T14:00:00+05:30"; $eventEnd = "${tomorrow}T16:00:00+05:30"
  $event = CallApi POST '/api/events' @{ title='Owner Workflow Smoke Event'; venueId=$listing.id; startDatetime=$eventStart; endDatetime=$eventEnd; priceText='Free' } $owner.token
  Check ($event.sourceType -eq 'OWNER' -and $event.venueName -eq 'Smoke Test Studio') 'Owner can publish an event at own approved venue'
  $duplicateDenied = $false
  try { CallApi POST '/api/events' @{ title='Owner Workflow Smoke Event'; venueId=$listing.id; startDatetime=$eventStart; endDatetime=$eventEnd; priceText='Free' } $owner.token | Out-Null } catch { $duplicateDenied = $true }
  Check $duplicateDenied 'Duplicate owner event is rejected after exact verification'
  $eventVisible = CallApi GET '/api/events' $null $customer.token
  Check (@($eventVisible | Where-Object id -eq $event.id).Count -eq 1) 'Published owner event is visible to customers'
  $eventDenied = $false
  try { CallApi POST '/api/events' @{ title='Other Owner Event'; venueId='v1'; startDatetime=$eventStart; endDatetime=$eventEnd; priceText='Free' } $owner.token | Out-Null } catch { $eventDenied = $true }
  Check $eventDenied 'Owner cannot publish events at another account venue'
  $bookingBody = @{ venueId=$listing.id; start="${tomorrow}T07:37:00+05:30"; end="${tomorrow}T11:07:00+05:30"; purpose='Smoke test booking'; guests=12 }
  $booking = CallApi POST '/api/bookings' $bookingBody $customer.token
  Check ($booking.status -eq 'REQUESTED' -and $booking.customerId -eq $customer.user.id -and $booking.customerName -eq 'Smoke Customer') 'Booking request is attached to the signed-in customer'
  Check ($booking.subtotal -eq 7000 -and $booking.fee -eq 560 -and $booking.total -eq 7560) 'Minute-level booking subtotal and 8 percent fee'
  $overlapDenied = $false
  try { CallApi POST '/api/bookings' $bookingBody $customer.token | Out-Null } catch { $overlapDenied = $true }
  Check $overlapDenied 'Overlapping booking request is rejected'
  Check (@((CallApi GET '/api/bookings/my' $null $customer.token) | Where-Object id -eq $booking.id).Count -eq 1) 'Customer can retrieve own booking'
  Check (@((CallApi GET '/api/bookings/my' $null $owner.token) | Where-Object id -eq $booking.id).Count -eq 1) 'Listing owner can retrieve incoming booking'
  CallApi PATCH "/api/bookings/$($booking.id)/approve" $null $owner.token | Out-Null
  $customerBookingsAfterApproval = CallApi GET '/api/bookings/my' $null $customer.token
  $approvedBooking = @($customerBookingsAfterApproval | Where-Object id -eq $booking.id)[0]
  Check ($approvedBooking.status -eq 'APPROVED') 'Owner approval is visible to the customer'
  $demoVenues = CallApi GET '/api/venues' $null $customer.token
  Check (@($demoVenues | Where-Object dataLabel -eq 'DEMO_OWNER_LISTING').Count -eq 0) 'Sample catalogue venues are not shown as real spaces'
  $adminDenied = $false
  try { CallApi GET '/api/admin/venues/pending' $null $customer.token | Out-Null } catch { $adminDenied = $true }
  Check $adminDenied 'Customer is denied admin access'
  try {
    $places = CallApi GET '/api/discovery/places?query=Mumbai'
    $osmTagged = @($places | Where-Object source -eq 'OPENSTREETMAP').Count -eq @($places).Count
    Check (@($places).Count -gt 0 -and $osmTagged -and (@($places | Where-Object availabilityConfirmed -ne $false).Count -eq 0)) 'Live Overpass places are tagged unverified'
  } catch { Write-Warning ("Live Overpass check unavailable: " + $_.Exception.Message) }
  Write-Output 'PASS: owner to admin to customer to owner workflow complete'
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  if ($vite -and -not $vite.HasExited) { Stop-Process -Id $vite.Id -Force }
  if (Test-Path -LiteralPath $data) { Remove-Item -LiteralPath $data -Recurse -Force }
  if (Test-Path -LiteralPath $serverOut) { Remove-Item -LiteralPath $serverOut -Force }
  if (Test-Path -LiteralPath $serverErr) { Remove-Item -LiteralPath $serverErr -Force }
  if (Test-Path -LiteralPath $viteOut) { Remove-Item -LiteralPath $viteOut -Force }
  if (Test-Path -LiteralPath $viteErr) { Remove-Item -LiteralPath $viteErr -Force }
  Remove-Item Env:DROP_DATA_DIR -ErrorAction SilentlyContinue
  Remove-Item Env:PORT -ErrorAction SilentlyContinue
Remove-Item Env:DROP_API_PORT -ErrorAction SilentlyContinue
}
