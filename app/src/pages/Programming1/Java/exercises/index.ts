import {
  ArrowDownWideNarrow,
  Calculator,
  ListOrdered,
  Repeat,
  TerminalSquare,
} from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

interface JavaExerciseDefinition extends ExerciseDefinition {
  titleKey: TranslationKey;
  fileName: string;
  starterCode: string;
}

const defaultStarterCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("Start coding in Java!");
  }
}
`;

export const javaProgrammingExercises: JavaExerciseDefinition[] = [
  {
    titleKey: "java.exercise1",
    descriptionKey: "java.exercise1Desc",
    difficulty: "easy",
    icon: TerminalSquare,
    fileName: "Main.java",
    starterCode: `public class Main {
  public static void main(String[] args) {
    // TODO: print Hello World once
  }
}
`,
  },
  {
    titleKey: "java.exercise2",
    descriptionKey: "java.exercise2Desc",
    difficulty: "easy",
    icon: Repeat,
    fileName: "Main.java",
    starterCode: `public class Main {
  public static void main(String[] args) {
    // TODO: print Hello World five times with a loop
  }
}
`,
  },
  {
    titleKey: "java.exercise3",
    descriptionKey: "java.exercise3Desc",
    difficulty: "easy",
    icon: Calculator,
    fileName: "Main.java",
    starterCode: `public class Main {
  public static void main(String[] args) {
    int firstNumber = 7;
    int secondNumber = 5;

    // TODO: store the sum in a variable and print it
  }
}
`,
  },
  {
    titleKey: "java.exercise4",
    descriptionKey: "java.exercise4Desc",
    difficulty: "medium",
    icon: ArrowDownWideNarrow,
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
  },
  {
    titleKey: "java.exercise5",
    descriptionKey: "java.exercise5Desc",
    difficulty: "medium",
    icon: ListOrdered,
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
  },
];

export function getJavaStarterCode(exerciseId?: string) {
  return (
    javaProgrammingExercises.find(
      (exercise) => exercise.titleKey === exerciseId,
    )?.starterCode ?? defaultStarterCode
  );
}

export function getJavaFileName(exerciseId?: string) {
  return (
    javaProgrammingExercises.find(
      (exercise) => exercise.titleKey === exerciseId,
    )?.fileName ?? "Main.java"
  );
}
