import com.drop.algorithms.*;
import java.util.*;

/** Reproducible comparative microbenchmarks. Reports median of five measured batches after warm-up. */
public final class AlgorithmBenchmarks {
    private static volatile long sink;
    private static final int REPEATS = 5;
    public static void main(String[] args) {
        int[] sizes = {1_000, 10_000, 50_000};
        System.out.println("Algorithm,InputSize,OptimizedMedianMs,BaselineMedianMs,Notes");
        for (int n : sizes) benchmarkHeap(n);
        for (int n : sizes) benchmarkTrie(n);
        for (int n : sizes) benchmarkSegmentTree(n);
    }
    private static void benchmarkHeap(int n) {
        Random random = new Random(20261124L + n); double[] scores = new double[n];
        for (int i=0;i<n;i++) scores[i]=random.nextDouble()*1000;
        long[] fast=new long[REPEATS], base=new long[REPEATS];
        for(int run=-2;run<REPEATS;run++){
            long a=System.nanoTime(); MaxHeap<Integer> heap=new MaxHeap<>(); for(int i=0;i<n;i++)heap.add(scores[i],i); long sum=0; for(int i=0;i<Math.min(100,n);i++)sum+=heap.poll().value(); long elapsed=System.nanoTime()-a; sink+=sum; if(run>=0)fast[run]=elapsed;
            a=System.nanoTime(); List<Double> sorted=new ArrayList<>(n); for(double x:scores)sorted.add(x); sorted.sort(Comparator.reverseOrder()); sum=0; for(int i=0;i<Math.min(100,n);i++)sum+=sorted.get(i); elapsed=System.nanoTime()-a; sink+=(long)sum; if(run>=0)base[run]=elapsed;
        }
        row("MaxHeap top-100",n,median(fast),median(base),"heap build + 100 extracts versus full sort");
    }
    private static void benchmarkTrie(int n) {
        List<String> words=new ArrayList<>(n); for(int i=0;i<n;i++)words.add("bandra-venue-"+i);
        Trie trie=new Trie(); for(String w:words)trie.insert(w);
        long[] fast=new long[REPEATS],base=new long[REPEATS];
        for(int run=-2;run<REPEATS;run++){
            long a=System.nanoTime(); int count=0; for(int j=0;j<500;j++)count+=trie.suggest(List.of(),"bandra-venue-49",20).size(); long elapsed=System.nanoTime()-a; sink+=count; if(run>=0)fast[run]=elapsed;
            a=System.nanoTime(); count=0; for(int j=0;j<500;j++){int found=0;for(String w:words)if(w.startsWith("bandra-venue-49")&&found<20)found++;count+=found;} elapsed=System.nanoTime()-a; sink+=count; if(run>=0)base[run]=elapsed;
        }
        row("Trie prefix lookup x500",n,median(fast),median(base),"indexed prefix query versus 500 linear scans; build excluded");
    }
    private static void benchmarkSegmentTree(int n) {
        int[] slots=new int[n]; Random r=new Random(7); for(int i=0;i<n;i++)slots[i]=r.nextBoolean()?1:0;
        SegmentTree tree=new SegmentTree(slots); int l=n/4, rr=Math.max(l,n*3/4-1); long[] fast=new long[REPEATS],base=new long[REPEATS];
        int expected=0;for(int i=l;i<=rr;i++)expected+=slots[i];
        for(int run=-2;run<REPEATS;run++){
            long a=System.nanoTime();int result=0;for(int j=0;j<5000;j++)result+=tree.query(l,rr);long elapsed=System.nanoTime()-a;if(result!=expected*5000)throw new AssertionError("Segment tree mismatch");sink+=result;if(run>=0)fast[run]=elapsed;
            a=System.nanoTime();int baseline=0;for(int j=0;j<5000;j++)for(int i=l;i<=rr;i++)baseline+=slots[i];elapsed=System.nanoTime()-a;if(baseline!=expected*5000)throw new AssertionError("Linear baseline mismatch");sink+=baseline;if(run>=0)base[run]=elapsed;
        }
        row("SegmentTree range query x5000",n,median(fast),median(base),"indexed range sum versus linear scan; build excluded");
    }
    private static long median(long[] values){long[] copy=values.clone();Arrays.sort(copy);return copy[copy.length/2];}
    private static void row(String name,int n,long optimized,long baseline,String notes){System.out.printf(Locale.ROOT,"%s,%d,%.4f,%.4f,%s%n",name,n,optimized/1e6,baseline/1e6,notes);}
}
