/*:
 * @plugindesc Barra de HP simples acima dos inimigos na batalha. A posição da barra pode ser adaptada no código.
 * @author Lino
 *
 * @param Bar Width
 * @type number
 * @default 100
 *
 * @param Bar Height
 * @type number
 * @default 8
 *
 * @param Bar Gap
 * @type number
 * @default 10
 *
 * @help
 * Exibe uma barra de HP diretamente acima dos inimigos.
 */

(function() {

    var parameters = PluginManager.parameters('EnemyHpBar');

    var BAR_WIDTH = Number(parameters['Bar Width'] || 100);
    var BAR_HEIGHT = Number(parameters['Bar Height'] || 8);
    var BAR_GAP = Number(parameters['Bar Gap'] || 10); // offset entre barra e sprite de inimigo
    
    // Sprite_Enemy.prototype.initMembers é responsável pela inicialização dos inimigos no combate.
    var _Sprite_Enemy_initMembers = Sprite_Enemy.prototype.initMembers;

    // nessa inicialização, criamos também a barra de vida, através da classe Bitmap. Definimos também sua posição, e então
    // acrescentamos o objeto recém criado à cena, através de addChild.
    Sprite_Enemy.prototype.initMembers = function() {
        _Sprite_Enemy_initMembers.call(this);

        this._hpBar = new Sprite();
        this._hpBar.bitmap = new Bitmap(BAR_WIDTH, BAR_HEIGHT);

        this._hpBar.x = -BAR_WIDTH / 2;
        this._hpBar.y = -BAR_HEIGHT - BAR_GAP;

        this.addChild(this._hpBar);
    };
    
    // Atualização de sprite
    var _Sprite_Enemy_update = Sprite_Enemy.prototype.update;

    // na atualização de sprite, também atualizamos a barra de hp e a posição da barra de hp.
    Sprite_Enemy.prototype.update = function() {
        _Sprite_Enemy_update.call(this);

        this.updateHpBar();
        this.updateHpBarPosition();
    };

    Sprite_Enemy.prototype.updateHpBarPosition = function() {

        // esses ifs são apenas para garantir que a função saia imediatamente caso estas entidades não existam no momento da
        // chamada, evitando assim mensagem de erro.
        if (!this._hpBar) {
            return;
        }

        if (!this.bitmap) {
            return;
        }

        if (!this.bitmap.isReady()) {
            return;
        }

        this._hpBar.x = -BAR_WIDTH / 2;

        // bitmap.height é a altura da imagem, enquanto que scale.y é o fator de escala no eixo y da imagem, caso esteja escalada, de modo que a barra acompanhará sempre o tamanho y da imagem, não importa a escala vertical dela.
        this._hpBar.y = -(this.bitmap.height * this.scale.y) - BAR_HEIGHT - BAR_GAP;
    };

    // criação do método de atualização da barra de vida dos inimigos.
    Sprite_Enemy.prototype.updateHpBar = function() {

        if (!this._hpBar) {
            return;
        }

        if (!this._enemy) {
            return;
        }

        var enemy = this._enemy; // seleciona o inimigo.

        //mhp = max hp. rate se refere ao índice de redução da vida do inimigo, isto é, a redução da quantia de hp visual mostrada pela barra.
        var rate = enemy.mhp > 0 ? enemy.hp / enemy.mhp : 0;

        rate = Math.max(0, Math.min(1, rate));

        var bitmap = this._hpBar.bitmap;

        bitmap.clear();

        // Fundo
        bitmap.fillAll('#000000');

        // HP
        bitmap.fillRect(1, 1, (BAR_WIDTH - 2) * rate, BAR_HEIGHT - 2, '#e53935');

        this._hpBar.visible = enemy.isAlive();
    };

})();

