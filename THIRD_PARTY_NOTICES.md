# Third-party notices

## Project code

The original source code of this project is licensed separately, unless otherwise stated.

## teavm-javac

This project uses a browser-based Java compiler module built from:

https://github.com/konsoletyper/teavm-javac

The compiler module contains:
- OpenJDK javac / jdk.compiler
- TeaVM compiler components

The module is compiled to WebAssembly and distributed as part of the frontend application.

License for teavm-javac project code:
Apache License 2.0

## TeaVM

TeaVM is used to compile Java bytecode to WebAssembly.

License:
Apache License 2.0

Source:
https://github.com/konsoletyper/teavm

## OpenJDK

This project includes components from the OpenJDK project, including javac / jdk.compiler, compiled to WebAssembly for browser execution.

OpenJDK repository:
https://github.com/openjdk/jdk25u

OpenJDK revision used by the current build:
6c48f4ed707bf0b15f9b6098de30db8aae6fa40f

OpenJDK components:
- javac / jdk.compiler
- required OpenJDK dependencies used by teavm-javac

License:
GNU General Public License version 2 with the Classpath Exception

No OpenJDK source files were modified.

The OpenJDK components remain licensed under GPLv2 with the Classpath Exception.
The project’s own code is licensed separately.
