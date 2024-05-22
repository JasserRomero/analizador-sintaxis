(() => {
  const $ = (e) => document.querySelector(e);
  const regex = { digit: /[0-9]/, letter: /[a-zA-Z_]/ };
  const keywords = ["INSERT", "INTO", "VALUES", "SET"];
  const symbols = ["(", ")", ",", "'", '"', ";", "="];

  const update = () => {
    let line = 1;
    let text = $("#workspace").value;

    // Limpiar las líneas previas
    $(".line").innerHTML = "";

    // Actualizar la numeración de líneas
    text.split("\n").forEach(() => {
      $(".line").innerHTML += "<p class='m-0'>" + line + "</p>";
      line++;
    });

    // Convertir ciertas palabras a mayúsculas
    keywords.forEach((keyword) => {
      const regex = new RegExp("\\b" + keyword + "\\b", "gi");
      text = text.replace(regex, keyword.toUpperCase());
    });

    // Actualizar el valor del textarea con el texto modificado
    $("#workspace").value = text;
  };

  const cleanText = () => {
    $("#workspace").value = "";
    //document.getElementById("contenedorSalida").style.display = "none";
    $("#workspace").focus();
  };

  const showError = (lines, position, typeError, msgError, line) => {
    line +=
      "<span class='text-danger fw-bold text-decoration-underline'>" +
      typeError +
      " </span>";

    $("#salida").innerHTML =
      "<div>Se esperaba '" +
      msgError +
      "' , no un -> " +
      typeError +
      "</div><div> ERROR en la linea " +
      (lines[position - 1].line + 1) +
      ", en la posicion -> " +
      position +
      "</div><div class='bg-warning'>" +
      line +
      "</div>";
  };

  const loadLines = (text, textSplit) => {
    var lines = [];
    let size = 0;
    for (let index = 0; index < textSplit.length; index++) {
      for (let jndex = 0; jndex < textSplit[index].length + 1; jndex++) {
        if (text[size] !== undefined) {
          lines.push({
            line: index,
            position: size,
            text: text[size],
          });
          size += 1;
        }
      }
    }
    return lines;
  };

  const generateLexicon = (code, value, token) => {
    let table = "<tr>";
    table += '<th scope="row">' + code + "</th>";
    table += "<td>" + value + "</td>";
    table += "<td>" + token + "</td>";
    table += "</tr>";
    $("#salidaLexico").innerHTML = table;
  };

  const generateSyntax = (style, type, value, message) => {
    const syntaxDiv = document.createElement("div");
    syntaxDiv.innerHTML = `${type} <strong class="text-${style}">${message} -> </strong> ${value}`;
    $("#salidaSintactico").appendChild(syntaxDiv);
  };

  const analyzeLexicon = (input) => {
    let inputWithoutSpace = input.trim();
    let tokens = [];
    let current = 0;

    // Agregamos un espacio y un punto y coma al final para asegurarnos de que se capturen todos los tokens
    if (inputWithoutSpace[inputWithoutSpace.length - 1] === ";") {
      inputWithoutSpace += " ";
    } else {
      inputWithoutSpace = inputWithoutSpace + "; ";
    }

    // Función para agregar un token al array de tokens
    const addToken = (code, type, value, position) => {
      tokens.push({ code, type, value, position });
    };

    while (current < inputWithoutSpace.length - 1) {
      const currentChar = inputWithoutSpace[current];

      // Saltamos los espacios pero se cuentan.
      if (/\s+/.test(currentChar)) {
        current++;
        continue;
      }

      // Manejo de palabras clave
      if (regex.letter.test(currentChar)) {
        let letters = currentChar;

        while (
          regex.letter.test(inputWithoutSpace[++current]) ||
          regex.digit.test(inputWithoutSpace[current])
        ) {
          letters += inputWithoutSpace[current];
        }

        if (keywords.includes(letters)) {
          addToken("002", "IDENTIFICADOR", letters, current);
          continue;
        }

        addToken("003", "TEXTO", letters, current);
        continue;
      }

      // Manejo de números
      if (regex.digit.test(currentChar)) {
        let number = currentChar;

        while (regex.digit.test(inputWithoutSpace[++current])) {
          number += inputWithoutSpace[current];
        }

        addToken("005", "NUMERO", number, current);
        continue;
      }

      // Manejo de símbolos
      if (symbols.includes(currentChar)) {
        addToken("004", "SIMBOLO", currentChar, current);
        current++;
        continue;
      }

      generateLexicon("ERROR", currentChar, "NO SE RECONOCE");
      break;
    }

    console.log(tokens);
    return tokens;
  };

  const analyze = () => {
    $("#salidaLexico").value = "";
    $("#salidaSintactico").value = "";
    let text = $("#workspace").value;

    // Añadir punto y coma al final del texto si no está presente
    if (!text.endsWith(";")) {
      text += ";";
      $("#workspace").value = text;
    }

    const arrayLines = analyzeLexicon(text);
    if (text == "" || text == null) {
      $("#salida").innerHTML =
        "<strong class='bg-warning'>Escribe o pega el código a analizar</strong>";
    } else {
      const textSplit = text.split("\n");

      let lines = loadLines(text, textSplit);
      let lineHtml = "";

      for (let i = 0; i < arrayLines.length; i++) {
        if (arrayLines[i].value == ";") continue;

        // COMPROBAR "INSERT"
        if (keywords.includes(arrayLines[i].value)) {
          generateSyntax(
            "success",
            arrayLines[i].type,
            arrayLines[i].value,
            "Correcto"
          );
          lineHtml += "<span>" + arrayLines[i].value + " </span>";
          i += 1;

          // COMPORBAR "INTO"
          if (keywords.includes(arrayLines[i].value)) {
            generateSyntax(
              "success",
              arrayLines[i].type,
              arrayLines[i].value,
              "Correcto"
            );
            lineHtml += "<span>" + arrayLines[i].value + " </span>";
            i += 1;

            // COMPROBAR NOMBRE DE LA TABLA
            if (arrayLines[i].type == "TEXTO") {
              generateSyntax(
                "success",
                arrayLines[i].type,
                arrayLines[i].value,
                "Correcto"
              );
              lineHtml += "<span>" + arrayLines[i].value + " </span>";
              i += 1;

              /**
               * Si viene "(" es porque es una sintaxis como la siguiente
               * INSERT INTO person (first_name, last_name) VALUES ('John', 'Doe');
               *
               * Si viene SIMBOLO ya sea SET o VALUES es porque es una sintaxis como la siguiente
               * INSERT INTO tbl_name VALUES (1, "row 1"), (2, "row 2");
               * INSERT INTO person SET first_name = 'John', last_name = 'Doe';
               *
               * Si viene otra cosa, se desconoce
               */

              if (arrayLines[i].type === "IDENTIFICADOR") {
                // Caso #1. Identificador === SET
                if (arrayLines[i].value.toUpperCase() === "SET") {
                  generateSyntax(
                    "success",
                    arrayLines[i].type,
                    arrayLines[i].value,
                    "Correcto"
                  );
                  lineHtml += "<span>" + arrayLines[i].value + " </span>";
                  i += 1;

                  // Comprobar asignaciones de campos y valores
                  let error = false;
                  while (arrayLines[i].value !== ";") {
                    // Comprobar el nombre del campo
                    if (arrayLines[i].type === "TEXTO") {
                      generateSyntax(
                        "success",
                        arrayLines[i].type,
                        arrayLines[i].value,
                        "Correcto"
                      );
                      lineHtml += "<span>" + arrayLines[i].value + " </span>";
                      i += 1;

                      // Comprobar el operador "="
                      if (arrayLines[i].value === "=") {
                        generateSyntax(
                          "success",
                          arrayLines[i].type,
                          arrayLines[i].value,
                          "Correcto"
                        );
                        lineHtml += "<span>" + arrayLines[i].value + " </span>";
                        i += 1;

                        // Comprobar el valor entre comillas simples o dobles
                        if (
                          arrayLines[i].value === '"' ||
                          arrayLines[i].value === "'"
                        ) {
                          let quoteType = arrayLines[i].value;
                          generateSyntax(
                            "success",
                            arrayLines[i].type,
                            arrayLines[i].value,
                            "Correcto"
                          );
                          lineHtml +=
                            "<span>" + arrayLines[i].value + " </span>";
                          i += 1;

                          // Comprobar el texto dentro de las comillas
                          if (arrayLines[i].type === "TEXTO") {
                            generateSyntax(
                              "success",
                              arrayLines[i].type,
                              arrayLines[i].value,
                              "Correcto"
                            );
                            lineHtml +=
                              "<span>" + arrayLines[i].value + " </span>";
                            i += 1;

                            // Comprobar la comilla de cierre
                            if (arrayLines[i].value === quoteType) {
                              generateSyntax(
                                "success",
                                arrayLines[i].type,
                                arrayLines[i].value,
                                "Correcto"
                              );
                              lineHtml +=
                                "<span>" + arrayLines[i].value + " </span>";
                              i += 1;

                              // Comprobar la coma o el punto y coma
                              if (
                                arrayLines[i].value === "," ||
                                arrayLines[i].value === ";"
                              ) {
                                lineHtml +=
                                  "<span>" + arrayLines[i].value + " </span>";
                                if (arrayLines[i].value === ",") {
                                  generateSyntax(
                                    "success",
                                    arrayLines[i].type,
                                    arrayLines[i].value,
                                    "Correcto"
                                  );
                                  i += 1;
                                } else {
                                  break;
                                }
                              } else {
                                showError(
                                  lines,
                                  arrayLines[i].position,
                                  arrayLines[i].value,
                                  "',' o ';'",
                                  lineHtml
                                );
                                generateSyntax(
                                  "danger",
                                  arrayLines[i].type,
                                  arrayLines[i].value,
                                  "Incorrecto"
                                );
                                error = true;
                                break;
                              }
                            } else {
                              showError(
                                lines,
                                arrayLines[i].position,
                                arrayLines[i].value,
                                `Se esperaba ${quoteType} de cierre`,
                                lineHtml
                              );
                              generateSyntax(
                                "danger",
                                arrayLines[i].type,
                                arrayLines[i].value,
                                "Incorrecto"
                              );
                              error = true;
                              break;
                            }
                          } else {
                            showError(
                              lines,
                              arrayLines[i].position,
                              arrayLines[i].value,
                              "TEXTO",
                              lineHtml
                            );
                            generateSyntax(
                              "danger",
                              arrayLines[i].type,
                              arrayLines[i].value,
                              "Incorrecto"
                            );
                            error = true;
                            break;
                          }
                        } else {
                          showError(
                            lines,
                            arrayLines[i].position,
                            arrayLines[i].value,
                            `' o "`,
                            lineHtml
                          );
                          generateSyntax(
                            "danger",
                            arrayLines[i].type,
                            arrayLines[i].value,
                            "Incorrecto"
                          );
                          error = true;
                          break;
                        }
                      } else {
                        showError(
                          lines,
                          arrayLines[i].position,
                          arrayLines[i].value,
                          "=",
                          lineHtml
                        );
                        generateSyntax(
                          "danger",
                          arrayLines[i].type,
                          arrayLines[i].value,
                          "Incorrecto"
                        );
                        error = true;
                        break;
                      }
                    } else {
                      showError(
                        lines,
                        arrayLines[i].position,
                        arrayLines[i].value,
                        "TEXTO",
                        lineHtml
                      );
                      generateSyntax(
                        "danger",
                        arrayLines[i].type,
                        arrayLines[i].value,
                        "Incorrecto"
                      );
                      error = true;
                      break;
                    }
                  }
                  if (error) break;
                }

                // Caso #2. Identificador === VALUES
                if (arrayLines[i].value.toUpperCase() === "VALUES") {
                  if (arrayLines[i].value === "(") {
                    generateSyntax(
                      "success",
                      arrayLines[i].type,
                      arrayLines[i].value,
                      "Correcto"
                    );
                    lineHtml += "<span>" + arrayLines[i].value + " </span>";
                    i += 1;

                    // COMPROBAR CAMPOS
                    while (arrayLines[i].value !== ")") {
                      if (
                        arrayLines[i].value !== "," &&
                        arrayLines[i].value !== ")"
                      ) {
                        generateSyntax(
                          "success",
                          arrayLines[i].type,
                          arrayLines[i].value,
                          "Correcto"
                        );
                        lineHtml += "<span>" + arrayLines[i].value + " </span>";
                      } else {
                        lineHtml += "<span>" + arrayLines[i].value + " </span>";
                      }
                      i += 1;
                    }

                    // COMPROBAR CIERRE DE PARENTESIS )
                    if (arrayLines[i].value === ")") {
                      generateSyntax(
                        "success",
                        arrayLines[i].type,
                        arrayLines[i].value,
                        "Correcto"
                      );
                      lineHtml += "<span>" + arrayLines[i].value + " </span>";
                      i += 1;

                      // COMPROBAR "VALUES"
                      if (arrayLines[i].value.toUpperCase() === "VALUES") {
                        generateSyntax(
                          "success",
                          arrayLines[i].type,
                          arrayLines[i].value,
                          "Correcto"
                        );
                        lineHtml += "<span>" + arrayLines[i].value + " </span>";
                        i += 1;

                        // COMPROBAR APERTURA DE PARENTESIS PARA LOS VALORES (
                        if (arrayLines[i].value === "(") {
                          generateSyntax(
                            "success",
                            arrayLines[i].type,
                            arrayLines[i].value,
                            "Correcto"
                          );
                          lineHtml +=
                            "<span>" + arrayLines[i].value + " </span>";
                          i += 1;

                          // COMPROBAR VALORES
                          let error = false;
                          while (arrayLines[i].value !== ")") {
                            // Comprobar si el valor empieza con comilla simple o doble
                            if (
                              arrayLines[i].value === '"' ||
                              arrayLines[i].value === "'"
                            ) {
                              let quoteType = arrayLines[i].value;
                              generateSyntax(
                                "success",
                                arrayLines[i].type,
                                arrayLines[i].value,
                                "Correcto"
                              );
                              lineHtml +=
                                "<span>" + arrayLines[i].value + " </span>";
                              i += 1;

                              // Comprobar el texto dentro de las comillas
                              if (arrayLines[i].type === "TEXTO") {
                                generateSyntax(
                                  "success",
                                  arrayLines[i].type,
                                  arrayLines[i].value,
                                  "Correcto"
                                );
                                lineHtml +=
                                  "<span>" + arrayLines[i].value + " </span>";
                                i += 1;

                                // Comprobar la comilla de cierre
                                if (arrayLines[i].value === quoteType) {
                                  generateSyntax(
                                    "success",
                                    arrayLines[i].type,
                                    arrayLines[i].value,
                                    "Correcto"
                                  );
                                  lineHtml +=
                                    "<span>" + arrayLines[i].value + " </span>";
                                  i += 1;

                                  // Comprobar la coma o el cierre de paréntesis
                                  if (
                                    arrayLines[i].value === "," ||
                                    arrayLines[i].value === ")"
                                  ) {
                                    lineHtml +=
                                      "<span>" +
                                      arrayLines[i].value +
                                      " </span>";
                                    if (arrayLines[i].value === ",") {
                                      generateSyntax(
                                        "success",
                                        arrayLines[i].type,
                                        arrayLines[i].value,
                                        "Correcto"
                                      );
                                      i += 1;

                                      // Validar que tras una coma venga otro valor que empieza con comillas
                                      if (
                                        arrayLines[i].value !== '"' &&
                                        arrayLines[i].value !== "'"
                                      ) {
                                        showError(
                                          lines,
                                          arrayLines[i].position,
                                          arrayLines[i].value,
                                          `' o "`,
                                          lineHtml
                                        );
                                        generateSyntax(
                                          "danger",
                                          arrayLines[i].type,
                                          arrayLines[i].value,
                                          "Incorrecto"
                                        );
                                        error = true;
                                        break;
                                      }
                                    }
                                  } else {
                                    showError(
                                      lines,
                                      arrayLines[i].position,
                                      arrayLines[i].value,
                                      "',' o ')'",
                                      lineHtml
                                    );
                                    generateSyntax(
                                      "danger",
                                      arrayLines[i].type,
                                      arrayLines[i].value,
                                      "Incorrecto"
                                    );
                                    error = true;
                                    break;
                                  }
                                } else {
                                  showError(
                                    lines,
                                    arrayLines[i].position,
                                    arrayLines[i].value,
                                    `Se esperaba ${quoteType} de cierre`,
                                    lineHtml
                                  );
                                  generateSyntax(
                                    "danger",
                                    arrayLines[i].type,
                                    arrayLines[i].value,
                                    "Incorrecto"
                                  );
                                  error = true;
                                  break;
                                }
                              } else {
                                showError(
                                  lines,
                                  arrayLines[i].position,
                                  arrayLines[i].value,
                                  "TEXTO",
                                  lineHtml
                                );
                                generateSyntax(
                                  "danger",
                                  arrayLines[i].type,
                                  arrayLines[i].value,
                                  "Incorrecto"
                                );
                                error = true;
                                break;
                              }
                            } else {
                              showError(
                                lines,
                                arrayLines[i].position,
                                arrayLines[i].value,
                                `' o "`,
                                lineHtml
                              );
                              generateSyntax(
                                "danger",
                                arrayLines[i].type,
                                arrayLines[i].value,
                                "Incorrecto"
                              );
                              error = true;
                              break;
                            }
                          }
                          if (error) break;

                          // Comprobar cierre de paréntesis de los valores
                          if (arrayLines[i].value === ")") {
                            generateSyntax(
                              "success",
                              arrayLines[i].type,
                              arrayLines[i].value,
                              "Correcto"
                            );
                            lineHtml +=
                              "<span>" + arrayLines[i].value + " </span>";
                            i += 1;
                          } else {
                            showError(
                              lines,
                              arrayLines[i].position,
                              arrayLines[i].value,
                              ")",
                              lineHtml
                            );
                            generateSyntax(
                              "danger",
                              arrayLines[i].type,
                              arrayLines[i].value,
                              "Incorrecto"
                            );
                            break;
                          }
                        } else {
                          showError(
                            lines,
                            arrayLines[i].position,
                            arrayLines[i].value,
                            "(",
                            lineHtml
                          );
                          generateSyntax(
                            "danger",
                            arrayLines[i].type,
                            arrayLines[i].value,
                            "Incorrecto"
                          );
                          break;
                        }
                      } else {
                        showError(
                          lines,
                          arrayLines[i].position,
                          arrayLines[i].value,
                          "VALUES",
                          lineHtml
                        );
                        generateSyntax(
                          "danger",
                          arrayLines[i].type,
                          arrayLines[i].value,
                          "Incorrecto"
                        );
                        break;
                      }
                    } else {
                      showError(
                        lines,
                        arrayLines[i].position,
                        arrayLines[i].value,
                        ")",
                        lineHtml
                      );
                      generateSyntax(
                        "danger",
                        arrayLines[i].type,
                        arrayLines[i].value,
                        "Incorrecto"
                      );
                      break;
                    }
                  } else {
                    showError(
                      lines,
                      arrayLines[i].position,
                      arrayLines[i].value,
                      "(",
                      lineHtml
                    );
                    generateSyntax(
                      "danger",
                      arrayLines[i].type,
                      arrayLines[i].value,
                      "Incorrecto"
                    );
                    break;
                  }
                }
              } else if (
                arrayLines[i].type === "SIMBOLO" &&
                arrayLines[i].value !== ";"
              ) {
                // COMPROBAR APERTURA DE PARENTESIS (
                if (arrayLines[i].value === "(") {
                  generateSyntax(
                    "success",
                    arrayLines[i].type,
                    arrayLines[i].value,
                    "Correcto"
                  );
                  lineHtml += "<span>" + arrayLines[i].value + " </span>";
                  i += 1;

                  // COMPROBAR CAMPOS
                  while (arrayLines[i].value !== ")") {
                    if (
                      arrayLines[i].value !== "," &&
                      arrayLines[i].value !== ")"
                    ) {
                      generateSyntax(
                        "success",
                        arrayLines[i].type,
                        arrayLines[i].value,
                        "Correcto"
                      );
                      lineHtml += "<span>" + arrayLines[i].value + " </span>";
                    } else {
                      lineHtml += "<span>" + arrayLines[i].value + " </span>";
                    }
                    i += 1;
                  }

                  // COMPROBAR CIERRE DE PARENTESIS )
                  if (arrayLines[i].value === ")") {
                    generateSyntax(
                      "success",
                      arrayLines[i].type,
                      arrayLines[i].value,
                      "Correcto"
                    );
                    lineHtml += "<span>" + arrayLines[i].value + " </span>";
                    i += 1;

                    // COMPROBAR VALUES
                    if (arrayLines[i].value === "VALUES") {
                      generateSyntax(
                        "success",
                        arrayLines[i].type,
                        arrayLines[i].value,
                        "Correcto"
                      );
                      lineHtml += "<span>" + arrayLines[i].value + " </span>";
                      i += 1;

                      if (arrayLines[i].value === "(") {
                        generateSyntax(
                          "success",
                          arrayLines[i].type,
                          arrayLines[i].value,
                          "Correcto"
                        );
                        lineHtml += "<span>" + arrayLines[i].value + " </span>";
                        i += 1;

                        // COMPROBAR VALORES
                        let error = false;
                        while (arrayLines[i].value !== ")") {
                          // Comprobar si el valor empieza con comilla simple o doble
                          if (
                            arrayLines[i].value === '"' ||
                            arrayLines[i].value === "'"
                          ) {
                            let quoteType = arrayLines[i].value;
                            generateSyntax(
                              "success",
                              arrayLines[i].type,
                              arrayLines[i].value,
                              "Correcto"
                            );
                            lineHtml +=
                              "<span>" + arrayLines[i].value + " </span>";
                            i += 1;

                            // Comprobar el texto dentro de las comillas
                            if (arrayLines[i].type === "TEXTO") {
                              generateSyntax(
                                "success",
                                arrayLines[i].type,
                                arrayLines[i].value,
                                "Correcto"
                              );
                              lineHtml +=
                                "<span>" + arrayLines[i].value + " </span>";
                              i += 1;

                              // Comprobar la comilla de cierre
                              if (arrayLines[i].value === quoteType) {
                                generateSyntax(
                                  "success",
                                  arrayLines[i].type,
                                  arrayLines[i].value,
                                  "Correcto"
                                );
                                lineHtml +=
                                  "<span>" + arrayLines[i].value + " </span>";
                                i += 1;

                                // Comprobar la coma o el cierre de paréntesis
                                if (
                                  arrayLines[i].value === "," ||
                                  arrayLines[i].value === ")"
                                ) {
                                  lineHtml +=
                                    "<span>" + arrayLines[i].value + " </span>";
                                  if (arrayLines[i].value === ",") {
                                    generateSyntax(
                                      "success",
                                      arrayLines[i].type,
                                      arrayLines[i].value,
                                      "Correcto"
                                    );
                                    i += 1;
                                  }
                                } else {
                                  showError(
                                    lines,
                                    arrayLines[i].position,
                                    arrayLines[i].value,
                                    "',' o ')'",
                                    lineHtml
                                  );
                                  generateSyntax(
                                    "danger",
                                    arrayLines[i].type,
                                    arrayLines[i].value,
                                    "Incorrecto"
                                  );
                                  error = true;
                                  break;
                                }
                              } else {
                                showError(
                                  lines,
                                  arrayLines[i].position,
                                  arrayLines[i].value,
                                  `Se esperaba ${quoteType} de cierre`,
                                  lineHtml
                                );
                                generateSyntax(
                                  "danger",
                                  arrayLines[i].type,
                                  arrayLines[i].value,
                                  "Incorrecto"
                                );
                                error = true;
                                break;
                              }
                            } else {
                              showError(
                                lines,
                                arrayLines[i].position,
                                arrayLines[i].value,
                                "TEXTO",
                                lineHtml
                              );
                              generateSyntax(
                                "danger",
                                arrayLines[i].type,
                                arrayLines[i].value,
                                "Incorrecto"
                              );
                              error = true;
                              break;
                            }
                          } else {
                            console.log(arrayLines[i].value);
                            showError(
                              lines,
                              arrayLines[i].position,
                              arrayLines[i].value,
                              `' o "`,
                              lineHtml
                            );
                            generateSyntax(
                              "danger",
                              arrayLines[i].type,
                              arrayLines[i].value,
                              "Incorrecto"
                            );
                            error = true;
                            break;
                          }
                        }

                        if (error) break;
                      } else {
                        showError(
                          lines,
                          arrayLines[i].position,
                          arrayLines[i].value,
                          `(`,
                          lineHtml
                        );
                        generateSyntax(
                          "danger",
                          arrayLines[i].type,
                          arrayLines[i].value,
                          "Incorrecto"
                        );
                        break;
                      }
                    } else {
                      showError(
                        lines,
                        arrayLines[i].position,
                        arrayLines[i].value,
                        "VALUES",
                        lineHtml
                      );
                      generateSyntax(
                        "danger",
                        arrayLines[i].type,
                        arrayLines[i].value,
                        "Incorrecto"
                      );
                      break;
                    }
                  } else {
                    showError(
                      lines,
                      arrayLines[i].position,
                      arrayLines[i].value,
                      ")",
                      lineHtml
                    );
                    generateSyntax(
                      "danger",
                      arrayLines[i].type,
                      arrayLines[i].value,
                      "Incorrecto"
                    );
                    break;
                  }
                } else {
                  showError(
                    lines,
                    arrayLines[i].position,
                    arrayLines[i].value,
                    "(",
                    lineHtml
                  );
                  generateSyntax(
                    "danger",
                    arrayLines[i].type,
                    arrayLines[i].value,
                    "Incorrecto"
                  );
                  break;
                }
              } else {
                showError(
                  lines,
                  arrayLines[i].position,
                  arrayLines[i].value,
                  "SET o VALUES o (",
                  lineHtml
                );
                generateSyntax(
                  "danger",
                  arrayLines[i].type,
                  arrayLines[i].value,
                  "Incorrecto"
                );
                break;
              }
            } else {
              showError(
                lines,
                arrayLines[i].position,
                arrayLines[i].value,
                "Nombre tabla o nombre invalido",
                lineHtml
              );
              generateSyntax(
                "danger",
                arrayLines[i].type,
                arrayLines[i].value,
                "Incorrecto"
              );
              break;
            }
          } else {
            showError(
              lines,
              arrayLines[i].position,
              arrayLines[i].value,
              "INTO",
              lineHtml
            );
            generateSyntax(
              "danger",
              arrayLines[i].type,
              arrayLines[i].value,
              "Incorrecto"
            );
            break;
          }
        } else {
          showError(
            lines,
            arrayLines[i].position,
            arrayLines[i].value,
            "INSERT",
            lineHtml
          );
          generateSyntax(
            "danger",
            arrayLines[i].type,
            arrayLines[i].value,
            "Incorrecto"
          );
          break;
        }
      }
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    /* listener */
    $("#workspace").addEventListener("keyup", update);
    $("#workspace").addEventListener("change", update);

    // Clean
    $("#clean").addEventListener("click", cleanText);

    // Analyzen
    $("#analyze").addEventListener("click", analyze);
  });
})();
