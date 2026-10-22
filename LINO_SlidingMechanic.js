/*:
 * @plugindesc Mecânica simples de sliding em superfícies com obstáculos. Mais apropriada para superfícies congeladas ou escorregadias.
 * @author Lino
 * @help V1.0
 * Para utilizar este plugin, crie um evento paralelo no seu mapa,
 * passando então o seguinte comando à primeira linha da primeira página do
 * evento: slide start
 *
 * Após isto, certifique-se de que as regiões de deslizamento do mapa sejam
 * marcadas com 1.
 *
 * @param Sliding Region
 * @type number
 * @desc Insira o Id que você usa para a região de deslizamento no mapa.
 */

// TODO: verei se é melhor fazer o comando "slide start" ser chamado numa nota do mapa, ao invés de em evento.
(function () {
  var params = PluginManager.parameters("LINO_SlidingMechanic");
  var slidingRegionId = params["Sliding Region"] ? params["Sliding Region"] : 1;

  var _onMapLoaded = Scene_Map.prototype.onMapLoaded;
  // Para que o código rode somente quando o mapa for carregado:
  Scene_Map.prototype.onMapLoaded = function () {
    _onMapLoaded.call(this);

    var _Game_Interpreter_pluginCommand =
      Game_Interpreter.prototype.pluginCommand;

    // Para que o código dentro deste bloco seguinte só rode se o evento que o abriga tiver o comando "slide start" na primeira linha.
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
      _Game_Interpreter_pluginCommand.call(this, command, args);

      if (command.trim().toLowerCase() === "slide") {
        if (args[0] && args[0].trim().toLowerCase() === "start") {
          // Nota 1
          if (
            $gamePlayer.regionId() === slidingRegionId &&
            !$gamePlayer.isMoveRouteForcing()
          ) {
            var playerDir = $gamePlayer.direction();
            var routeCode = null;

            if ($gamePlayer.canPass($gamePlayer.x, $gamePlayer.y, playerDir)) {
              routeCode = 12; // 12 = Game_Character.ROUTE_MOVE_FORWARD
            } else {
              // Sobre a implementação de Input.isPressed e relacionados, ver linha 3197 de rpg_core.js do seu projeto.
              if (Input.isPressed("left")) {
                routeCode = 2;
              } else if (Input.isPressed("right")) {
                routeCode = 3;
              } else if (Input.isPressed("up")) {
                routeCode = 4;
              } else if (Input.isPressed("down")) {
                routeCode = 1;
              }
            }

            $gamePlayer.forceMoveRoute({
              list: [
                { code: 32, parameters: [] }, // Game_Character.ROUTE_WALK_ANIME_OFF
                { code: routeCode, parameters: [] },
                { code: 0, parameters: [] },
              ],
              wait: true,
            });
            // END
          } else if ($gamePlayer.regionId() !== slidingRegionId) {
            $gamePlayer.setWalkAnime(true); // se o jogador sair da região de deslize, reativa animação de andar.
          }
        }
        // END IF
      }
      // END Game_Interpreter
    };
    // END SCENE_MAP
  };
  // END FUNCTION
})();

// ################################################### NOTAS #####################################################################
// Nota 1: se jogador pisar na região marcada com 1, e a rota já não tiver sendo forçada no momento em que pisa em tal região, executa então a rota. Checar se a rota não está sendo executada é importante porque este plugin deve ser executado em um evento de tipo paralelo, e eventos paralelos executam novamente a cada frame, de modo que o code 32 e o 12 iriam ficar num ciclo infinito, fazendo com que o personagem ficasse preso no lugar (deadlock), ao invés de continuar a mover adiante. Então a checagem ocorre a cada frame, e como no começo de cada frame o isMoveRouteForcing é false (pois se torna false quando a rota chega no code 0), o próximo passo pode então ser executado sem deadlock.
