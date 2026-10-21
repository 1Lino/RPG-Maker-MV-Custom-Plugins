/*:
 * @plugindesc Mecânica simples de sliding em superfícies com obstáculos. Mais apropriada para superfícies congeladas ou escorregadias.
 * @author Lino
 * @help V0.1.0
 */

(function () {
  var _onMapLoaded = Scene_Map.prototype.onMapLoaded;

  // Para que o código rode somente quando o mapa for carregado:
  Scene_Map.prototype.onMapLoaded = function () {
    _onMapLoaded.call(this);

    // Códigos de todas as rotas disponíveis são encontrados a partir da linha 6840 do arquivo rpg_objects.js, na pasta do projeto. Basta digitar NOTA na pesquisa para encontrar, no arquivo, os pontos de interesse.
    // Também a implementação do setMoveRoute está lá. setMoveRoute recebe um objeto contendo as seguintes propriedades: list, repeat, skippable e wait, sendo que list deve necessariamente terminar com 0, que se refere ao código do final da rota.
    $gamePlayer.forceMoveRoute({
      list: [
        { code: 12, parameters: [] },
        { code: 0, parameters: [] },
      ], // Game_Character.ROUTE_MOVE_FORWARD => 1 Step Forward
      repeat: false,
      skippable: true,
      wait: true,
    });
    // END
  };
  // END FILE
})();
