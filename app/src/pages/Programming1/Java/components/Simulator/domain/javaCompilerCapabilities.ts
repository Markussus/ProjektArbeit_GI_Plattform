export type JavaCompilerSupportStatus = "supported" | "limited" | "blocked";

export interface JavaCompilerCapability {
  id: string;
  status: JavaCompilerSupportStatus;
  titleKey: string;
  descriptionKey: string;
  examples: string[];
  snippets?: string[];
}

export const JAVA_COMPILER_VERSION_INFO = {
  javaVersion: "JDK 25",
} as const;

export const JAVA_COMPILER_CAPABILITIES: JavaCompilerCapability[] = [
  {
    id: "program-shape",
    status: "supported",
    titleKey: "java-programming.commandOverview.capabilities.programShape.title",
    descriptionKey:
      "java-programming.commandOverview.capabilities.programShape.description",
    examples: [
      "public class Main",
      "public static void main(String[] args)",
      "helper methods",
    ],
  },
  {
    id: "basics",
    status: "supported",
    titleKey: "java-programming.commandOverview.capabilities.basics.title",
    descriptionKey: "java-programming.commandOverview.capabilities.basics.description",
    examples: ["int/double/boolean", "String", "if/else", "switch", "methods"],
  },
  {
    id: "loops",
    status: "supported",
    titleKey: "java-programming.commandOverview.capabilities.loops.title",
    descriptionKey: "java-programming.commandOverview.capabilities.loops.description",
    examples: ["for", "while", "do/while", "for-each", "break", "continue"],
  },
  {
    id: "arrays-collections",
    status: "supported",
    titleKey: "java-programming.commandOverview.capabilities.arraysCollections.title",
    descriptionKey:
      "java-programming.commandOverview.capabilities.arraysCollections.description",
    examples: [
      "int[]",
      "String[]",
      "Arrays.sort",
      "ArrayList",
      "LinkedList",
      "HashMap",
      "HashSet",
      "Collections.sort",
    ],
    snippets: [
      "int[] numbers = {3, 1, 2};\nArrays.sort(numbers);",
      'ArrayList<String> names = new ArrayList<>();\nnames.add("Ada");',
    ],
  },
  {
    id: "strings-math",
    status: "supported",
    titleKey: "java-programming.commandOverview.capabilities.stringsMath.title",
    descriptionKey: "java-programming.commandOverview.capabilities.stringsMath.description",
    examples: [
      "StringBuilder",
      "String.split",
      "Math.max",
      "Math.round",
      "BigInteger",
      "BigDecimal",
    ],
    snippets: [
      'String text = "hello";\nSystem.out.println(text.toUpperCase());',
      "System.out.println(Math.max(3, 7));",
    ],
  },
  {
    id: "objects",
    status: "supported",
    titleKey: "java-programming.commandOverview.capabilities.objects.title",
    descriptionKey: "java-programming.commandOverview.capabilities.objects.description",
    examples: [
      "classes",
      "constructors",
      "interfaces",
      "static methods",
      "enum",
      "record",
    ],
    snippets: [
      "class Student {\n  String name;\n  Student(String name) { this.name = name; }\n}",
    ],
  },
  {
    id: "output",
    status: "supported",
    titleKey: "java-programming.commandOverview.capabilities.output.title",
    descriptionKey: "java-programming.commandOverview.capabilities.output.description",
    examples: ["System.out.print", "System.out.println", "System.err.println"],
  },
  {
    id: "standard-library",
    status: "limited",
    titleKey: "java-programming.commandOverview.capabilities.standardLibrary.title",
    descriptionKey:
      "java-programming.commandOverview.capabilities.standardLibrary.description",
    examples: [
      "java.lang",
      "java.util",
      "java.math",
      "java.time basics",
      "exceptions",
    ],
  },
  {
    id: "single-file",
    status: "limited",
    titleKey: "java-programming.commandOverview.capabilities.singleFile.title",
    descriptionKey: "java-programming.commandOverview.capabilities.singleFile.description",
    examples: [
      "one Main.java editor file",
      "inner classes",
      "helper classes",
      "no separate files",
    ],
  },
  {
    id: "input",
    status: "limited",
    titleKey: "java-programming.commandOverview.capabilities.input.title",
    descriptionKey: "java-programming.commandOverview.capabilities.input.description",
    examples: ["Scanner.nextLine()", "Scanner.nextInt()"],
    snippets: [
      "Scanner scanner = new Scanner(System.in);\nString line = scanner.nextLine();",
    ],
  },
  {
    id: "cli",
    status: "blocked",
    titleKey: "java-programming.commandOverview.capabilities.cli.title",
    descriptionKey: "java-programming.commandOverview.capabilities.cli.description",
    examples: ["java", "javac", "jshell", "jar", "javadoc", "mvn", "gradle"],
  },
  {
    id: "environment",
    status: "blocked",
    titleKey: "java-programming.commandOverview.capabilities.environment.title",
    descriptionKey: "java-programming.commandOverview.capabilities.environment.description",
    examples: ["files", "sockets", "processes", "native libraries"],
  },
  {
    id: "runtime-features",
    status: "blocked",
    titleKey: "java-programming.commandOverview.capabilities.runtimeFeatures.title",
    descriptionKey:
      "java-programming.commandOverview.capabilities.runtimeFeatures.description",
    examples: ["reflection-heavy code", "dynamic class loading", "threads"],
  },
];
