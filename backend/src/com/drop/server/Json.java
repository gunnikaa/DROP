package com.drop.server;
import java.util.*;
/** Small JSON reader/writer to keep the backend dependency-free (plain JDK). */
public final class Json {
 private Json(){}
 public static Object parse(String s){return new Parser(s).value();}
 @SuppressWarnings("unchecked") public static Map<String,Object> object(String s){Object x=parse(s);return x instanceof Map?(Map<String,Object>)x:new LinkedHashMap<>();}
 public static String stringify(Object x){if(x==null)return "null";if(x instanceof String)return quote((String)x);if(x instanceof Number||x instanceof Boolean)return x.toString();if(x instanceof Map<?,?> m){StringJoiner j=new StringJoiner(",","{","}");m.forEach((k,v)->j.add(quote(String.valueOf(k))+":"+stringify(v)));return j.toString();}if(x instanceof Collection<?> c){StringJoiner j=new StringJoiner(",","[","]");for(Object v:c)j.add(stringify(v));return j.toString();}return quote(x.toString());}
 private static String quote(String s){return "\""+s.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r")+"\"";}
 private static final class Parser{final String s;int i;Parser(String s){this.s=s==null?"":s;}void ws(){while(i<s.length()&&Character.isWhitespace(s.charAt(i)))i++;}Object value(){ws();if(i>=s.length())return null;char c=s.charAt(i);if(c=='{')return obj();if(c=='[')return arr();if(c=='"')return str();if(s.startsWith("true",i)){i+=4;return true;}if(s.startsWith("false",i)){i+=5;return false;}if(s.startsWith("null",i)){i+=4;return null;}int st=i;while(i<s.length()&&"-+0123456789.eE".indexOf(s.charAt(i))>=0)i++;String n=s.substring(st,i);try{return n.contains(".")||n.contains("e")||n.contains("E")?Double.valueOf(n):Long.valueOf(n);}catch(Exception e){return n;}}
 Map<String,Object> obj(){Map<String,Object>m=new LinkedHashMap<>();i++;ws();while(i<s.length()&&s.charAt(i)!='}'){String k=str();ws();if(i<s.length()&&s.charAt(i)==':')i++;m.put(k,value());ws();if(i<s.length()&&s.charAt(i)==','){i++;ws();}else break;}if(i<s.length())i++;return m;}
 List<Object> arr(){List<Object>a=new ArrayList<>();i++;ws();while(i<s.length()&&s.charAt(i)!=']'){a.add(value());ws();if(i<s.length()&&s.charAt(i)==','){i++;ws();}else break;}if(i<s.length())i++;return a;}
 String str(){if(i<s.length()&&s.charAt(i)=='"')i++;StringBuilder b=new StringBuilder();while(i<s.length()){char c=s.charAt(i++);if(c=='"')break;if(c=='\\'&&i<s.length()){char e=s.charAt(i++);b.append(switch(e){case 'n'->'\n';case 'r'->'\r';case 't'->'\t';default->e;});}else b.append(c);}return b.toString();}}
}
