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
