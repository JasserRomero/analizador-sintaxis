(() => {
  const $ = (e) => document.querySelector(e);
  const keywords = ["INSERT", "INTO", "VALUES"];
  const symbols = ["(", ")", ",", "'", '"', ";"];

  const update = () => {
    let line = 1;
    let text = $("#workspace").value;
    $(".line").innerHTML = " ";
    text.split("\n").map(() => {
      $(".line").innerHTML += "<p class='m-0'>" + line + "</p>";
      line++;
    });
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
      (position - 1) +
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
      const LETTER = /[a-zA-Z]/;
      if (LETTER.test(currentChar)) {
        let letters = currentChar;

        while (LETTER.test(inputWithoutSpace[++current])) {
          letters += inputWithoutSpace[current];
        }

        if (keywords.includes(letters)) {
          addToken("002", "IDENTIFICADOR", letters, current);
          continue;
        }

        addToken("003", "TEXTO", letters, current);
        continue;
      }

      // Manejo de símbolos
      if (symbols.includes(currentChar)) {
        addToken("002", "SIMBOLO", currentChar, current);
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
    const text = $("#workspace").value;
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
            let TableName = arrayLines[i].value;
            if (!TableName || TableName.charAt(0) !== '"') {
              generateSyntax(
                "success",
                arrayLines[i].type,
                arrayLines[i].value,
                "Correcto"
              );
              lineHtml += "<span>" + arrayLines[i].value + " </span>";
              i += 1;

              // COMPROBAMOS PARENTESIS QUE ABRE "("
              const openParen = arrayLines[i].value;
              if (openParen) {
                console.log(openParen);
              } else {
                showError(
                  lines,
                  arrayLines[i].position,
                  arrayLines[i].value,
                  "Error! Se esperaba un (",
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
                "Nombre de tabla no válido",
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
