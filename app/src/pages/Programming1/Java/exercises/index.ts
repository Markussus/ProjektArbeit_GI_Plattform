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
}

export interface JavaExerciseScenario extends JavaScenarioBase {
  kind: "exercise";
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

const defaultStarterCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("Start coding in Java!");
  }
}
`;

export const javaProgrammingExamples: JavaExampleScenario[] = [
  {
    kind: "example",
    id: "java.example1Title",
    titleKey: "java.example1Title",
    descriptionKey: "java.example1Text",
    fileName: "Main.java",
    code: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}
`,
    definition: {
      titleKey: "java.example1Title",
      descriptionKey: "java.example1Text",
      icon: BookOpen,
    },
  },
  {
    kind: "example",
    id: "java.example2Title",
    titleKey: "java.example2Title",
    descriptionKey: "java.example2Text",
    fileName: "Main.java",
    code: `public class Main {
  public static void main(String[] args) {
    for (int i = 0; i < 5; i++) {
      System.out.println("Hello World");
    }
  }
}
`,
    definition: {
      titleKey: "java.example2Title",
      descriptionKey: "java.example2Text",
      icon: Repeat,
    },
  },
  {
    kind: "example",
    id: "java.example3Title",
    titleKey: "java.example3Title",
    descriptionKey: "java.example3Text",
    fileName: "Main.java",
    code: `import java.util.Arrays;

public class Main {
  public static void main(String[] args) {
    int[] numbers = {5, 2, 9, 1, 4};
    Arrays.sort(numbers);
    System.out.println(Arrays.toString(numbers));
  }
}
`,
    definition: {
      titleKey: "java.example3Title",
      descriptionKey: "java.example3Text",
      icon: Code2,
    },
  },
];

export const javaProgrammingExercises: JavaExerciseScenario[] = (
  [
    {
      kind: "exercise",
      id: "java.exercise1",
      titleKey: "java.exercise1",
      descriptionKey: "java.exercise1Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    // TODO: print Hello World once
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}
`,
      validationCases: [
        {
          id: "hello-world",
          expectedStdout: "Hello World\n",
        },
      ],
      code: `public class Main {
  public static void main(String[] args) {
    // TODO: print Hello World once
  }
}
`,
      definition: {
        titleKey: "java.exercise1",
        descriptionKey: "java.exercise1Desc",
        difficulty: "easy",
        icon: TerminalSquare,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise2",
      titleKey: "java.exercise2",
      descriptionKey: "java.exercise2Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    // TODO: print Hello World five times with a loop
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    for (int i = 0; i < 5; i++) {
      System.out.println("Hello World");
    }
  }
}
`,
      validationCases: [
        {
          id: "five-lines",
          expectedStdout:
            "Hello World\nHello World\nHello World\nHello World\nHello World\n",
        },
      ],
      code: `public class Main {
  public static void main(String[] args) {
    // TODO: print Hello World five times with a loop
  }
}
`,
      definition: {
        titleKey: "java.exercise2",
        descriptionKey: "java.exercise2Desc",
        difficulty: "easy",
        icon: Repeat,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise3",
      titleKey: "java.exercise3",
      descriptionKey: "java.exercise3Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    int firstNumber = 7;
    int secondNumber = 5;

    // TODO: store the sum in a variable and print it
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    int firstNumber = 7;
    int secondNumber = 5;
    int sum = firstNumber + secondNumber;

    System.out.println(sum);
  }
}
`,
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
      code: `public class Main {
  public static void main(String[] args) {
    int firstNumber = 7;
    int secondNumber = 5;
    int sum = 0;

    // TODO: calculate the sum of both numbers
    System.out.println(sum);
  }
}
`,
      definition: {
        titleKey: "java.exercise3",
        descriptionKey: "java.exercise3Desc",
        difficulty: "easy",
        icon: Calculator,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise4",
      titleKey: "java.exercise4",
      descriptionKey: "java.exercise4Desc",
      fileName: "Main.java",
      starterCode: `import java.util.Arrays;

public class Main {
  public static void main(String[] args) {
    int[] numbers = {5, 2, 9, 1, 4};

    // TODO: sort the array in ascending order

    System.out.println(Arrays.toString(numbers));
  }
}
`,
      solutionCode: `import java.util.Arrays;

public class Main {
  public static void main(String[] args) {
    int[] numbers = {5, 2, 9, 1, 4};
    Arrays.sort(numbers);

    System.out.println(Arrays.toString(numbers));
  }
}
`,
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
      code: `import java.util.Arrays;

public class Main {
  public static void main(String[] args) {
    int[] numbers = {5, 2, 9, 1, 4};

    // TODO: sort the array in ascending order
    System.out.println(Arrays.toString(numbers));
  }
}
`,
      definition: {
        titleKey: "java.exercise4",
        descriptionKey: "java.exercise4Desc",
        difficulty: "medium",
        icon: ArrowDownWideNarrow,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise5",
      titleKey: "java.exercise5",
      descriptionKey: "java.exercise5Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    int[] numbers = {3, 8, 1, 6, 9};
    int max = numbers[0];

    // TODO: find the largest value in the array

    System.out.println(max);
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    int[] numbers = {3, 8, 1, 6, 9};
    int max = numbers[0];

    for (int number : numbers) {
      if (number > max) {
        max = number;
      }
    }

    System.out.println(max);
  }
}
`,
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
      code: `public class Main {
  public static void main(String[] args) {
    int[] numbers = {3, 8, 1, 6, 9};
    int max = numbers[0];

    // TODO: find the largest value
    System.out.println(max);
  }
}
`,
      definition: {
        titleKey: "java.exercise5",
        descriptionKey: "java.exercise5Desc",
        difficulty: "medium",
        icon: ListOrdered,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise6",
      titleKey: "java.exercise6",
      descriptionKey: "java.exercise6Desc",
      fileName: "Main.java",
      starterCode: `import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    String text = scanner.nextLine();

    // TODO: print the text in uppercase
  }
}
`,
      solutionCode: `import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    String text = scanner.nextLine();

    System.out.println(text.toUpperCase());
  }
}
`,
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
      code: `import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    String text = scanner.nextLine();

    // TODO: print the text in uppercase
  }
}
`,
      definition: {
        titleKey: "java.exercise6",
        descriptionKey: "java.exercise6Desc",
        difficulty: "medium",
        icon: TerminalSquare,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise7",
      titleKey: "java.exercise7",
      descriptionKey: "java.exercise7Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    System.out.println(square(6));
  }

  static int square(int value) {
    // TODO: return value multiplied by itself
    return 0;
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    System.out.println(square(6));
  }

  static int square(int value) {
    return value * value;
  }
}
`,
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
      code: `public class Main {
  public static void main(String[] args) {
    System.out.println(square(6));
  }

  static int square(int value) {
    // TODO: return value multiplied by itself
    return 0;
  }
}
`,
      definition: {
        titleKey: "java.exercise7",
        descriptionKey: "java.exercise7Desc",
        difficulty: "medium",
        icon: Calculator,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise8",
      titleKey: "java.exercise8",
      descriptionKey: "java.exercise8Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    Student student = new Student("Ada", 21);
    System.out.println(student.describe());
  }
}

class Student {
  String name;
  int age;

  Student(String name, int age) {
    // TODO: store both constructor arguments
  }

  String describe() {
    // TODO: return "Ada is 21"
    return "";
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    Student student = new Student("Ada", 21);
    System.out.println(student.describe());
  }
}

class Student {
  String name;
  int age;

  Student(String name, int age) {
    this.name = name;
    this.age = age;
  }

  String describe() {
    return name + " is " + age;
  }
}
`,
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
      code: `public class Main {
  public static void main(String[] args) {
    Student student = new Student("Ada", 21);
    System.out.println(student.describe());
  }
}

class Student {
  String name;
  int age;

  Student(String name, int age) {
    // TODO: store both constructor arguments
  }

  String describe() {
    // TODO: return "Ada is 21"
    return "";
  }
}
`,
      definition: {
        titleKey: "java.exercise8",
        descriptionKey: "java.exercise8Desc",
        difficulty: "medium",
        icon: Code2,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise9",
      titleKey: "java.exercise9",
      descriptionKey: "java.exercise9Desc",
      fileName: "Main.java",
      starterCode: `import java.util.ArrayList;
import java.util.Collections;

public class Main {
  public static void main(String[] args) {
    ArrayList<Integer> numbers = new ArrayList<>();
    numbers.add(4);
    numbers.add(1);
    numbers.add(4);
    numbers.add(2);

    // TODO: sort the list and print it
  }
}
`,
      solutionCode: `import java.util.ArrayList;
import java.util.Collections;

public class Main {
  public static void main(String[] args) {
    ArrayList<Integer> numbers = new ArrayList<>();
    numbers.add(4);
    numbers.add(1);
    numbers.add(4);
    numbers.add(2);

    Collections.sort(numbers);
    System.out.println(numbers);
  }
}
`,
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
      code: `import java.util.ArrayList;
import java.util.Collections;

public class Main {
  public static void main(String[] args) {
    ArrayList<Integer> numbers = new ArrayList<>();
    numbers.add(4);
    numbers.add(1);
    numbers.add(4);
    numbers.add(2);

    // TODO: sort the list and print it
  }
}
`,
      definition: {
        titleKey: "java.exercise9",
        descriptionKey: "java.exercise9Desc",
        difficulty: "medium",
        icon: ListOrdered,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise10",
      titleKey: "java.exercise10",
      descriptionKey: "java.exercise10Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    int limit = 15;

    for (int number = 1; number <= limit; number++) {
      // TODO: print Fizz for multiples of 3, Buzz for multiples
      // of 5, FizzBuzz for both, otherwise the number
    }
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    int limit = 15;

    for (int number = 1; number <= limit; number++) {
      if (number % 15 == 0) {
        System.out.println("FizzBuzz");
      } else if (number % 3 == 0) {
        System.out.println("Fizz");
      } else if (number % 5 == 0) {
        System.out.println("Buzz");
      } else {
        System.out.println(number);
      }
    }
  }
}
`,
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
      code: `public class Main {
  public static void main(String[] args) {
    int limit = 15;

    for (int number = 1; number <= limit; number++) {
      // TODO: implement FizzBuzz
    }
  }
}
`,
      definition: {
        titleKey: "java.exercise10",
        descriptionKey: "java.exercise10Desc",
        difficulty: "easy",
        icon: Repeat,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise11",
      titleKey: "java.exercise11",
      descriptionKey: "java.exercise11Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    String text = "lagerregal";
    System.out.println(isPalindrome(text));
  }

  static boolean isPalindrome(String text) {
    // TODO: compare characters from both ends
    return false;
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    String text = "lagerregal";
    System.out.println(isPalindrome(text));
  }

  static boolean isPalindrome(String text) {
    int left = 0;
    int right = text.length() - 1;

    while (left < right) {
      if (text.charAt(left) != text.charAt(right)) {
        return false;
      }
      left++;
      right--;
    }

    return true;
  }
}
`,
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
      code: `public class Main {
  public static void main(String[] args) {
    String text = "lagerregal";
    System.out.println(isPalindrome(text));
  }

  static boolean isPalindrome(String text) {
    // TODO: implement the palindrome check
    return false;
  }
}
`,
      definition: {
        titleKey: "java.exercise11",
        descriptionKey: "java.exercise11Desc",
        difficulty: "medium",
        icon: Code2,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise12",
      titleKey: "java.exercise12",
      descriptionKey: "java.exercise12Desc",
      fileName: "Main.java",
      starterCode: `public class Main {
  public static void main(String[] args) {
    int[][] matrix = {
      {3, 1, 4},
      {1, 5, 9},
      {2, 6, 5}
    };

    // TODO: print the sum of every row and then the main diagonal sum
  }
}
`,
      solutionCode: `public class Main {
  public static void main(String[] args) {
    int[][] matrix = {
      {3, 1, 4},
      {1, 5, 9},
      {2, 6, 5}
    };

    for (int row = 0; row < matrix.length; row++) {
      int rowSum = 0;
      for (int column = 0; column < matrix[row].length; column++) {
        rowSum += matrix[row][column];
      }
      System.out.println(rowSum);
    }

    int diagonalSum = 0;
    for (int index = 0; index < matrix.length; index++) {
      diagonalSum += matrix[index][index];
    }
    System.out.println(diagonalSum);
  }
}
`,
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
              `int[][] matrix = {
      {1, 2, 3},
      {4, 5, 6},
      {7, 8, 9}
    };`,
            ),
          expectedStdout: "6\n15\n24\n15\n",
        },
      ],
      code: `public class Main {
  public static void main(String[] args) {
    int[][] matrix = {
      {3, 1, 4},
      {1, 5, 9},
      {2, 6, 5}
    };

    // TODO: calculate row sums and the diagonal sum
  }
}
`,
      definition: {
        titleKey: "java.exercise12",
        descriptionKey: "java.exercise12Desc",
        difficulty: "hard",
        icon: Calculator,
      },
    },
    {
      kind: "exercise",
      id: "java.exercise13",
      titleKey: "java.exercise13",
      descriptionKey: "java.exercise13Desc",
      fileName: "Main.java",
      starterCode: `import java.util.ArrayList;

public class Main {
  public static void main(String[] args) {
    ShoppingCart cart = new ShoppingCart();
    cart.addPrice(499);
    cart.addPrice(1299);
    cart.addPrice(401);

    System.out.println(cart.getItemCount());
    System.out.println(cart.getTotalCents());
    System.out.println(cart.getMostExpensiveCents());
  }
}

class ShoppingCart {
  private ArrayList<Integer> prices = new ArrayList<>();

  void addPrice(int cents) {
    // TODO: add the price
  }

  int getItemCount() {
    return 0;
  }

  int getTotalCents() {
    return 0;
  }

  int getMostExpensiveCents() {
    return 0;
  }
}
`,
      solutionCode: `import java.util.ArrayList;

public class Main {
  public static void main(String[] args) {
    ShoppingCart cart = new ShoppingCart();
    cart.addPrice(499);
    cart.addPrice(1299);
    cart.addPrice(401);

    System.out.println(cart.getItemCount());
    System.out.println(cart.getTotalCents());
    System.out.println(cart.getMostExpensiveCents());
  }
}

class ShoppingCart {
  private ArrayList<Integer> prices = new ArrayList<>();

  void addPrice(int cents) {
    prices.add(cents);
  }

  int getItemCount() {
    return prices.size();
  }

  int getTotalCents() {
    int total = 0;
    for (int price : prices) {
      total += price;
    }
    return total;
  }

  int getMostExpensiveCents() {
    int mostExpensive = 0;
    for (int price : prices) {
      if (price > mostExpensive) {
        mostExpensive = price;
      }
    }
    return mostExpensive;
  }
}
`,
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
      code: `import java.util.ArrayList;

public class Main {
  public static void main(String[] args) {
    ShoppingCart cart = new ShoppingCart();
    cart.addPrice(499);
    cart.addPrice(1299);
    cart.addPrice(401);

    System.out.println(cart.getItemCount());
    System.out.println(cart.getTotalCents());
    System.out.println(cart.getMostExpensiveCents());
  }
}

class ShoppingCart {
  private ArrayList<Integer> prices = new ArrayList<>();

  void addPrice(int cents) {
    // TODO
  }

  int getItemCount() {
    return 0;
  }

  int getTotalCents() {
    return 0;
  }

  int getMostExpensiveCents() {
    return 0;
  }
}
`,
      definition: {
        titleKey: "java.exercise13",
        descriptionKey: "java.exercise13Desc",
        difficulty: "hard",
        icon: ListOrdered,
      },
    },
  ] satisfies JavaExerciseScenario[]
).sort(compareJavaExercisesByDifficulty);

export const javaProgrammingExerciseDefinitions: ExerciseDefinition[] =
  javaProgrammingExercises.map((exercise) => exercise.definition);

export const javaProgrammingExampleDefinitions: ExampleDefinition[] =
  javaProgrammingExamples.map((example) => example.definition);

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
