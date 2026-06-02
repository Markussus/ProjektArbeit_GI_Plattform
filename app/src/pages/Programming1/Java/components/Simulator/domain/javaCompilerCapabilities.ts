export type JavaCompilerSupportStatus = "supported" | "limited" | "blocked";

export interface JavaCompilerCapability {
  id: string;
  status: JavaCompilerSupportStatus;
  titleKey: string;
  descriptionKey: string;
  examples: string[];
}

export const JAVA_COMPILER_VERSION_INFO = {
  javaVersion: "JDK 25",
} as const;

export const JAVA_COMPILER_CAPABILITIES: JavaCompilerCapability[] = [
  {
    id: "program-shape",
    status: "supported",
    titleKey: "java.commandOverview.capabilities.programShape.title",
    descriptionKey:
      "java.commandOverview.capabilities.programShape.description",
    examples: [
      "public class Main",
      "public static void main(String[] args)",
      "helper methods",
    ],
  },
  {
    id: "basics",
    status: "supported",
    titleKey: "java.commandOverview.capabilities.basics.title",
    descriptionKey: "java.commandOverview.capabilities.basics.description",
    examples: ["int", "double", "boolean", "String", "if/else", "switch"],
  },
  {
    id: "loops",
    status: "supported",
    titleKey: "java.commandOverview.capabilities.loops.title",
    descriptionKey: "java.commandOverview.capabilities.loops.description",
    examples: ["for", "while", "do/while", "for-each", "break", "continue"],
  },
  {
    id: "arrays-collections",
    status: "supported",
    titleKey: "java.commandOverview.capabilities.arraysCollections.title",
    descriptionKey:
      "java.commandOverview.capabilities.arraysCollections.description",
    examples: [
      "int[]",
      "String[]",
      "Arrays.sort(...)",
      "ArrayList",
      "List",
      "HashMap",
    ],
  },
  {
    id: "objects",
    status: "supported",
    titleKey: "java.commandOverview.capabilities.objects.title",
    descriptionKey: "java.commandOverview.capabilities.objects.description",
    examples: ["classes", "constructors", "static methods", "enum", "record"],
  },
  {
    id: "output",
    status: "supported",
    titleKey: "java.commandOverview.capabilities.output.title",
    descriptionKey: "java.commandOverview.capabilities.output.description",
    examples: ["System.out.print", "System.out.println", "System.err.println"],
  },
  {
    id: "standard-library",
    status: "limited",
    titleKey: "java.commandOverview.capabilities.standardLibrary.title",
    descriptionKey:
      "java.commandOverview.capabilities.standardLibrary.description",
    examples: ["java.lang", "java.util", "java.math", "java.time basics"],
  },
  {
    id: "single-file",
    status: "limited",
    titleKey: "java.commandOverview.capabilities.singleFile.title",
    descriptionKey: "java.commandOverview.capabilities.singleFile.description",
    examples: ["one Main.java editor file", "inner classes", "helper classes"],
  },
  {
    id: "input",
    status: "limited",
    titleKey: "java.commandOverview.capabilities.input.title",
    descriptionKey: "java.commandOverview.capabilities.input.description",
    examples: ["System.in", "Scanner"],
  },
  {
    id: "cli",
    status: "blocked",
    titleKey: "java.commandOverview.capabilities.cli.title",
    descriptionKey: "java.commandOverview.capabilities.cli.description",
    examples: ["java", "javac", "jshell", "jar", "javadoc", "mvn", "gradle"],
  },
  {
    id: "environment",
    status: "blocked",
    titleKey: "java.commandOverview.capabilities.environment.title",
    descriptionKey: "java.commandOverview.capabilities.environment.description",
    examples: ["files", "sockets", "processes", "native libraries"],
  },
  {
    id: "runtime-features",
    status: "blocked",
    titleKey: "java.commandOverview.capabilities.runtimeFeatures.title",
    descriptionKey:
      "java.commandOverview.capabilities.runtimeFeatures.description",
    examples: ["reflection-heavy code", "dynamic class loading", "threads"],
  },
];
