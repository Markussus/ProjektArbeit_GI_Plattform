import {
  ArrowDownWideNarrow,
  BookOpen,
  Calculator,
  Code2,
  ListOrdered,
  Repeat,
  TerminalSquare,
} from "lucide-react";
import type {
  ExampleDefinition,
  ExerciseDefinition,
  ExerciseDifficulty,
} from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

export interface JavaValidationCase {
  id: string;
  sourceTransform?: (sourceCode: string) => string;
  stdin?: string;
  expectedStdout: string;
}

interface JavaScenarioBase {
  id: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  fileName: string;
  code: string;
  defaultStdin?: string;
}

export interface JavaExerciseScenario extends JavaScenarioBase {
  kind: "exercise";
  storageId: number;
  starterCode: string;
  solutionCode: string;
  validationCases: JavaValidationCase[];
  definition: ExerciseDefinition;
}

export interface JavaExampleScenario extends JavaScenarioBase {
  kind: "example";
  definition: ExampleDefinition;
}

export type JavaScenario = JavaExerciseScenario | JavaExampleScenario;

const exerciseDifficultyOrder: Record<ExerciseDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

const defaultStarterCode = `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Start coding in Java!");\n  }\n}\n`;

export const javaProgrammingExamples: JavaExampleScenario[] = [
  {
    kind: "example",
    id: "java-programming.example1Title",
    titleKey: "java-programming.example1Title",
    descriptionKey: "java-programming.example1Text",
    fileName: "Main.java",
    code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World");\n  }\n}\n`,
    definition: {
      titleKey: "java-programming.example1Title",
      descriptionKey: "java-programming.example1Text",
      icon: BookOpen,
    },
  },
  {
    kind: "example",
    id: "java-programming.example2Title",
    titleKey: "java-programming.example2Title",
    descriptionKey: "java-programming.example2Text",
    fileName: "Main.java",
    code: `public class Main {\n  public static void main(String[] args) {\n    for (int i = 0; i < 5; i++) {\n      System.out.println("Hello World");\n    }\n  }\n}\n`,
    definition: {
      titleKey: "java-programming.example2Title",
      descriptionKey: "java-programming.example2Text",
      icon: Repeat,
    },
  },
  {
    kind: "example",
    id: "java-programming.example3Title",
    titleKey: "java-programming.example3Title",
    descriptionKey: "java-programming.example3Text",
    fileName: "Main.java",
    code: `import java.util.Arrays;\n\npublic class Main {\n  public static void main(String[] args) {\n    int[] numbers = {5, 2, 9, 1, 4};\n    Arrays.sort(numbers);\n    System.out.println(Arrays.toString(numbers));\n  }\n}\n`,
    definition: {
      titleKey: "java-programming.example3Title",
      descriptionKey: "java-programming.example3Text",
      icon: Code2,
    },
  },
  {
    kind: "example",
    id: "java-programming.example4Title",
    titleKey: "java-programming.example4Title",
    descriptionKey: "java-programming.example4Text",
    fileName: "Main.java",
    defaultStdin: "Ada Lovelace\n21\n",
    code: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String name = scanner.nextLine();\n    int age = scanner.nextInt();\n\n    System.out.println("Hallo " + name + "! In 10 Jahren bist du " + (age + 10) + " Jahre alt.");\n  }\n}\n`,
    definition: {
      titleKey: "java-programming.example4Title",
      descriptionKey: "java-programming.example4Text",
      icon: TerminalSquare,
    },
  },
];

export const javaProgrammingExercises: JavaExerciseScenario[] = (
  [
    {
      kind: "exercise",
      id: "java-programming.exercise1",
      storageId: 0,
      titleKey: "java-programming.exercise1",
      descriptionKey: "java-programming.exercise1Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    // TODO: print Hello World once\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World");\n  }\n}\n`,
      validationCases: [
        {
          id: "hello-world",
          expectedStdout: "Hello World\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    // TODO: print Hello World once\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise1",
        descriptionKey: "java-programming.exercise1Desc",
        difficulty: "easy",
        icon: TerminalSquare,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise2",
      storageId: 1,
      titleKey: "java-programming.exercise2",
      descriptionKey: "java-programming.exercise2Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    // TODO: print Hello World five times with a loop\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    for (int i = 0; i < 5; i++) {\n      System.out.println("Hello World");\n    }\n  }\n}\n`,
      validationCases: [
        {
          id: "five-lines",
          expectedStdout:
            "Hello World\nHello World\nHello World\nHello World\nHello World\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    // TODO: print Hello World five times with a loop\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise2",
        descriptionKey: "java-programming.exercise2Desc",
        difficulty: "easy",
        icon: Repeat,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise3",
      storageId: 2,
      titleKey: "java-programming.exercise3",
      descriptionKey: "java-programming.exercise3Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    int firstNumber = 7;\n    int secondNumber = 5;\n\n    // TODO: store the sum in a variable and print it\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    int firstNumber = 7;\n    int secondNumber = 5;\n    int sum = firstNumber + secondNumber;\n\n    System.out.println(sum);\n  }\n}\n`,
      validationCases: [
        {
          id: "sum-default",
          expectedStdout: "12\n",
        },
        {
          id: "sum-other-values",
          sourceTransform: (sourceCode) =>
            sourceCode
              .replace(/int firstNumber = -?\d+;/, "int firstNumber = 13;")
              .replace(/int secondNumber = -?\d+;/, "int secondNumber = 29;"),
          expectedStdout: "42\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    int firstNumber = 7;\n    int secondNumber = 5;\n    int sum = 0;\n\n    // TODO: calculate the sum of both numbers\n    System.out.println(sum);\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise3",
        descriptionKey: "java-programming.exercise3Desc",
        difficulty: "easy",
        icon: Calculator,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise4",
      storageId: 3,
      titleKey: "java-programming.exercise4",
      descriptionKey: "java-programming.exercise4Desc",
      fileName: "Main.java",
      starterCode: `import java.util.Arrays;\n\npublic class Main {\n  public static void main(String[] args) {\n    int[] numbers = {5, 2, 9, 1, 4};\n\n    // TODO: sort the array in ascending order\n\n    System.out.println(Arrays.toString(numbers));\n  }\n}\n`,
      solutionCode: `import java.util.Arrays;\n\npublic class Main {\n  public static void main(String[] args) {\n    int[] numbers = {5, 2, 9, 1, 4};\n    Arrays.sort(numbers);\n\n    System.out.println(Arrays.toString(numbers));\n  }\n}\n`,
      validationCases: [
        {
          id: "sort-default-array",
          expectedStdout: "[1, 2, 4, 5, 9]\n",
        },
        {
          id: "sort-other-array",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /int\[\]\s+numbers\s*=\s*\{[^}]*\};/,
              "int[] numbers = {42, -1, 7, 7, 0};",
            ),
          expectedStdout: "[-1, 0, 7, 7, 42]\n",
        },
      ],
      code: `import java.util.Arrays;\n\npublic class Main {\n  public static void main(String[] args) {\n    int[] numbers = {5, 2, 9, 1, 4};\n\n    // TODO: sort the array in ascending order\n    System.out.println(Arrays.toString(numbers));\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise4",
        descriptionKey: "java-programming.exercise4Desc",
        difficulty: "medium",
        icon: ArrowDownWideNarrow,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise5",
      storageId: 4,
      titleKey: "java-programming.exercise5",
      descriptionKey: "java-programming.exercise5Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    int[] numbers = {3, 8, 1, 6, 9};\n    int max = numbers[0];\n\n    // TODO: find the largest value in the array\n\n    System.out.println(max);\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    int[] numbers = {3, 8, 1, 6, 9};\n    int max = numbers[0];\n\n    for (int number : numbers) {\n      if (number > max) {\n        max = number;\n      }\n    }\n\n    System.out.println(max);\n  }\n}\n`,
      validationCases: [
        {
          id: "max-default-array",
          expectedStdout: "9\n",
        },
        {
          id: "max-negative-array",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /int\[\]\s+numbers\s*=\s*\{[^}]*\};/,
              "int[] numbers = {-5, -11, -2, -9};",
            ),
          expectedStdout: "-2\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    int[] numbers = {3, 8, 1, 6, 9};\n    int max = numbers[0];\n\n    // TODO: find the largest value\n    System.out.println(max);\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise5",
        descriptionKey: "java-programming.exercise5Desc",
        difficulty: "medium",
        icon: ListOrdered,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise6",
      storageId: 5,
      titleKey: "java-programming.exercise6",
      descriptionKey: "java-programming.exercise6Desc",
      fileName: "Main.java",
      defaultStdin: "hello java\n",
      starterCode: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String text = scanner.nextLine();\n\n    // TODO: print the text in uppercase\n  }\n}\n`,
      solutionCode: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String text = scanner.nextLine();\n\n    System.out.println(text.toUpperCase());\n  }\n}\n`,
      validationCases: [
        {
          id: "uppercase-hello",
          stdin: "hello java\n",
          expectedStdout: "HELLO JAVA\n",
        },
        {
          id: "uppercase-browser",
          stdin: "Browser Compiler\n",
          expectedStdout: "BROWSER COMPILER\n",
        },
      ],
      code: `import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String text = scanner.nextLine();\n\n    // TODO: print the text in uppercase\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise6",
        descriptionKey: "java-programming.exercise6Desc",
        difficulty: "medium",
        icon: TerminalSquare,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise7",
      storageId: 6,
      titleKey: "java-programming.exercise7",
      descriptionKey: "java-programming.exercise7Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    System.out.println(square(6));\n  }\n\n  static int square(int value) {\n    // TODO: return value multiplied by itself\n    return 0;\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    System.out.println(square(6));\n  }\n\n  static int square(int value) {\n    return value * value;\n  }\n}\n`,
      validationCases: [
        {
          id: "square-default",
          expectedStdout: "36\n",
        },
        {
          id: "square-other-value",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /System\.out\.println\(square\(-?\d+\)\);/,
              "System.out.println(square(12));",
            ),
          expectedStdout: "144\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println(square(6));\n  }\n\n  static int square(int value) {\n    // TODO: return value multiplied by itself\n    return 0;\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise7",
        descriptionKey: "java-programming.exercise7Desc",
        difficulty: "medium",
        icon: Calculator,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise8",
      storageId: 7,
      titleKey: "java-programming.exercise8",
      descriptionKey: "java-programming.exercise8Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    Student student = new Student("Ada", 21);\n    System.out.println(student.describe());\n  }\n}\n\nclass Student {\n  String name;\n  int age;\n\n  Student(String name, int age) {\n    // TODO: store both constructor arguments\n  }\n\n  String describe() {\n    // TODO: return "Ada is 21"\n    return "";\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    Student student = new Student("Ada", 21);\n    System.out.println(student.describe());\n  }\n}\n\nclass Student {\n  String name;\n  int age;\n\n  Student(String name, int age) {\n    this.name = name;\n    this.age = age;\n  }\n\n  String describe() {\n    return name + " is " + age;\n  }\n}\n`,
      validationCases: [
        {
          id: "student-default",
          expectedStdout: "Ada is 21\n",
        },
        {
          id: "student-other-values",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /new Student\("[^"]+",\s*\d+\)/,
              'new Student("Grace", 30)',
            ),
          expectedStdout: "Grace is 30\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    Student student = new Student("Ada", 21);\n    System.out.println(student.describe());\n  }\n}\n\nclass Student {\n  String name;\n  int age;\n\n  Student(String name, int age) {\n    // TODO: store both constructor arguments\n  }\n\n  String describe() {\n    // TODO: return "Ada is 21"\n    return "";\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise8",
        descriptionKey: "java-programming.exercise8Desc",
        difficulty: "medium",
        icon: Code2,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise9",
      storageId: 8,
      titleKey: "java-programming.exercise9",
      descriptionKey: "java-programming.exercise9Desc",
      fileName: "Main.java",
      starterCode: `import java.util.ArrayList;\nimport java.util.Collections;\n\npublic class Main {\n  public static void main(String[] args) {\n    ArrayList<Integer> numbers = new ArrayList<>();\n    numbers.add(4);\n    numbers.add(1);\n    numbers.add(4);\n    numbers.add(2);\n\n    // TODO: sort the list and print it\n  }\n}\n`,
      solutionCode: `import java.util.ArrayList;\nimport java.util.Collections;\n\npublic class Main {\n  public static void main(String[] args) {\n    ArrayList<Integer> numbers = new ArrayList<>();\n    numbers.add(4);\n    numbers.add(1);\n    numbers.add(4);\n    numbers.add(2);\n\n    Collections.sort(numbers);\n    System.out.println(numbers);\n  }\n}\n`,
      validationCases: [
        {
          id: "list-default",
          expectedStdout: "[1, 2, 4, 4]\n",
        },
        {
          id: "list-other-values",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /numbers\.add\(4\);\s*numbers\.add\(1\);\s*numbers\.add\(4\);\s*numbers\.add\(2\);/,
              "numbers.add(9);\n    numbers.add(-1);\n    numbers.add(3);\n    numbers.add(3);",
            ),
          expectedStdout: "[-1, 3, 3, 9]\n",
        },
      ],
      code: `import java.util.ArrayList;\nimport java.util.Collections;\n\npublic class Main {\n  public static void main(String[] args) {\n    ArrayList<Integer> numbers = new ArrayList<>();\n    numbers.add(4);\n    numbers.add(1);\n    numbers.add(4);\n    numbers.add(2);\n\n    // TODO: sort the list and print it\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise9",
        descriptionKey: "java-programming.exercise9Desc",
        difficulty: "medium",
        icon: ListOrdered,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise10",
      storageId: 9,
      titleKey: "java-programming.exercise10",
      descriptionKey: "java-programming.exercise10Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    int limit = 15;\n\n    for (int number = 1; number <= limit; number++) {\n      // TODO: print Fizz for multiples of 3, Buzz for multiples\n      // of 5, FizzBuzz for both, otherwise the number\n    }\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    int limit = 15;\n\n    for (int number = 1; number <= limit; number++) {\n      if (number % 15 == 0) {\n        System.out.println("FizzBuzz");\n      } else if (number % 3 == 0) {\n        System.out.println("Fizz");\n      } else if (number % 5 == 0) {\n        System.out.println("Buzz");\n      } else {\n        System.out.println(number);\n      }\n    }\n  }\n}\n`,
      validationCases: [
        {
          id: "fizzbuzz-fifteen",
          expectedStdout:
            "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n",
        },
        {
          id: "fizzbuzz-eight",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(/int limit = \d+;/, "int limit = 8;"),
          expectedStdout: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    int limit = 15;\n\n    for (int number = 1; number <= limit; number++) {\n      // TODO: implement FizzBuzz\n    }\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise10",
        descriptionKey: "java-programming.exercise10Desc",
        difficulty: "easy",
        icon: Repeat,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise11",
      storageId: 10,
      titleKey: "java-programming.exercise11",
      descriptionKey: "java-programming.exercise11Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    String text = "lagerregal";\n    System.out.println(isPalindrome(text));\n  }\n\n  static boolean isPalindrome(String text) {\n    // TODO: compare characters from both ends\n    return false;\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    String text = "lagerregal";\n    System.out.println(isPalindrome(text));\n  }\n\n  static boolean isPalindrome(String text) {\n    int left = 0;\n    int right = text.length() - 1;\n\n    while (left < right) {\n      if (text.charAt(left) != text.charAt(right)) {\n        return false;\n      }\n      left++;\n      right--;\n    }\n\n    return true;\n  }\n}\n`,
      validationCases: [
        {
          id: "palindrome-true",
          expectedStdout: "true\n",
        },
        {
          id: "palindrome-false",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /String text = "[^"]*";/,
              'String text = "java";',
            ),
          expectedStdout: "false\n",
        },
        {
          id: "palindrome-even",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /String text = "[^"]*";/,
              'String text = "otto";',
            ),
          expectedStdout: "true\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    String text = "lagerregal";\n    System.out.println(isPalindrome(text));\n  }\n\n  static boolean isPalindrome(String text) {\n    // TODO: implement the palindrome check\n    return false;\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise11",
        descriptionKey: "java-programming.exercise11Desc",
        difficulty: "medium",
        icon: Code2,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise12",
      storageId: 11,
      titleKey: "java-programming.exercise12",
      descriptionKey: "java-programming.exercise12Desc",
      fileName: "Main.java",
      starterCode: `public class Main {\n  public static void main(String[] args) {\n    int[][] matrix = {\n      {3, 1, 4},\n      {1, 5, 9},\n      {2, 6, 5}\n    };\n\n    // TODO: print the sum of every row and then the main diagonal sum\n  }\n}\n`,
      solutionCode: `public class Main {\n  public static void main(String[] args) {\n    int[][] matrix = {\n      {3, 1, 4},\n      {1, 5, 9},\n      {2, 6, 5}\n    };\n\n    for (int row = 0; row < matrix.length; row++) {\n      int rowSum = 0;\n      for (int column = 0; column < matrix[row].length; column++) {\n        rowSum += matrix[row][column];\n      }\n      System.out.println(rowSum);\n    }\n\n    int diagonalSum = 0;\n    for (int index = 0; index < matrix.length; index++) {\n      diagonalSum += matrix[index][index];\n    }\n    System.out.println(diagonalSum);\n  }\n}\n`,
      validationCases: [
        {
          id: "matrix-default",
          expectedStdout: "8\n15\n13\n13\n",
        },
        {
          id: "matrix-other-values",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /int\[\]\[\]\s+matrix\s*=\s*\{[\s\S]*?\n\s*\};/,
              `int[][] matrix = {\n      {1, 2, 3},\n      {4, 5, 6},\n      {7, 8, 9}\n    };`,
            ),
          expectedStdout: "6\n15\n24\n15\n",
        },
      ],
      code: `public class Main {\n  public static void main(String[] args) {\n    int[][] matrix = {\n      {3, 1, 4},\n      {1, 5, 9},\n      {2, 6, 5}\n    };\n\n    // TODO: calculate row sums and the diagonal sum\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise12",
        descriptionKey: "java-programming.exercise12Desc",
        difficulty: "hard",
        icon: Calculator,
      },
    },
    {
      kind: "exercise",
      id: "java-programming.exercise13",
      storageId: 12,
      titleKey: "java-programming.exercise13",
      descriptionKey: "java-programming.exercise13Desc",
      fileName: "Main.java",
      starterCode: `import java.util.ArrayList;\n\npublic class Main {\n  public static void main(String[] args) {\n    ShoppingCart cart = new ShoppingCart();\n    cart.addPrice(499);\n    cart.addPrice(1299);\n    cart.addPrice(401);\n\n    System.out.println(cart.getItemCount());\n    System.out.println(cart.getTotalCents());\n    System.out.println(cart.getMostExpensiveCents());\n  }\n}\n\nclass ShoppingCart {\n  private ArrayList<Integer> prices = new ArrayList<>();\n\n  void addPrice(int cents) {\n    // TODO: add the price\n  }\n\n  int getItemCount() {\n    return 0;\n  }\n\n  int getTotalCents() {\n    return 0;\n  }\n\n  int getMostExpensiveCents() {\n    return 0;\n  }\n}\n`,
      solutionCode: `import java.util.ArrayList;\n\npublic class Main {\n  public static void main(String[] args) {\n    ShoppingCart cart = new ShoppingCart();\n    cart.addPrice(499);\n    cart.addPrice(1299);\n    cart.addPrice(401);\n\n    System.out.println(cart.getItemCount());\n    System.out.println(cart.getTotalCents());\n    System.out.println(cart.getMostExpensiveCents());\n  }\n}\n\nclass ShoppingCart {\n  private ArrayList<Integer> prices = new ArrayList<>();\n\n  void addPrice(int cents) {\n    prices.add(cents);\n  }\n\n  int getItemCount() {\n    return prices.size();\n  }\n\n  int getTotalCents() {\n    int total = 0;\n    for (int price : prices) {\n      total += price;\n    }\n    return total;\n  }\n\n  int getMostExpensiveCents() {\n    int mostExpensive = 0;\n    for (int price : prices) {\n      if (price > mostExpensive) {\n        mostExpensive = price;\n      }\n    }\n    return mostExpensive;\n  }\n}\n`,
      validationCases: [
        {
          id: "cart-default",
          expectedStdout: "3\n2199\n1299\n",
        },
        {
          id: "cart-other-prices",
          sourceTransform: (sourceCode) =>
            sourceCode.replace(
              /cart\.addPrice\(499\);\s*cart\.addPrice\(1299\);\s*cart\.addPrice\(401\);/,
              "cart.addPrice(250);\n    cart.addPrice(750);\n    cart.addPrice(1000);",
            ),
          expectedStdout: "3\n2000\n1000\n",
        },
      ],
      code: `import java.util.ArrayList;\n\npublic class Main {\n  public static void main(String[] args) {\n    ShoppingCart cart = new ShoppingCart();\n    cart.addPrice(499);\n    cart.addPrice(1299);\n    cart.addPrice(401);\n\n    System.out.println(cart.getItemCount());\n    System.out.println(cart.getTotalCents());\n    System.out.println(cart.getMostExpensiveCents());\n  }\n}\n\nclass ShoppingCart {\n  private ArrayList<Integer> prices = new ArrayList<>();\n\n  void addPrice(int cents) {\n    // TODO\n  }\n\n  int getItemCount() {\n    return 0;\n  }\n\n  int getTotalCents() {\n    return 0;\n  }\n\n  int getMostExpensiveCents() {\n    return 0;\n  }\n}\n`,
      definition: {
        titleKey: "java-programming.exercise13",
        descriptionKey: "java-programming.exercise13Desc",
        difficulty: "hard",
        icon: ListOrdered,
      },
    },
  ] satisfies JavaExerciseScenario[]
).sort(compareJavaExercisesByDifficulty);

export const javaProgrammingExerciseDefinitions: ExerciseDefinition[] =
  javaProgrammingExercises.map((exercise) => exercise.definition);

const scenarioById = new Map<TranslationKey, JavaScenario>(
  [...javaProgrammingExercises, ...javaProgrammingExamples].map((scenario) => [
    scenario.id,
    scenario,
  ]),
);

export function getJavaScenario(id?: string | null): JavaScenario | null {
  return scenarioById.get(id as TranslationKey) ?? null;
}

export function getJavaStarterCode(itemId?: string | null) {
  const scenario = getJavaScenario(itemId);

  if (scenario?.kind === "exercise") {
    return scenario.starterCode;
  }

  if (scenario?.kind === "example") {
    return scenario.code;
  }

  return defaultStarterCode;
}

export function getJavaDefaultStdin(itemId?: string | null): string {
  return getJavaScenario(itemId)?.defaultStdin ?? "";
}

export function getJavaFileName(itemId?: string | null) {
  return getJavaScenario(itemId)?.fileName ?? "Main.java";
}

function compareJavaExercisesByDifficulty(
  left: JavaExerciseScenario,
  right: JavaExerciseScenario,
): number {
  return (
    exerciseDifficultyOrder[left.definition.difficulty] -
    exerciseDifficultyOrder[right.definition.difficulty]
  );
}
