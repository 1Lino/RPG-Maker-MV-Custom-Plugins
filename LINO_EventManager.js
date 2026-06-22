/*:
 * @plugindesc Sistema de diálogo dinâmico.
 * @author Lino
 *
 * @help
 * Este plugin permite alterar os diálogos do jogo dinamicamente com base
 * em informações de arquivo JSON. Você deve pôr o nome do arquivo no parâmetro.
 * Este plugin é um protótipo, e poderá sofrer várias mudanças, e inclusive ser 
 * separado em vários outros, se for julgado necessário, para fins de organização.
 * 
 * @param Dialogue Picker
 * @text PATH: data/dialogues/
 * @type text
 * @desc Insira o nome do JSON na caixa de texto. O arquivo deve ficar neste caminho: "project_name/data/dialogues/".
 *
 */
 
// Criação do caminho para o arquivo:
const params = PluginManager.parameters("LINO_EventManager"); // seleciona os parâmetros deste plugin.
const fileName = params["Dialogue Picker"]; // puxa o conteúdo da caixa de texto Dialogue Picker, da interface do plugin.
const path = "data/dialogues/" + fileName + ".json"; // cria o caminho

function showConsole(){
	console.log(path);
}

// função responsável pelo carregamento do arquivo do path especificado.
function loadDiagJSON(path){
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open('GET', path);
		request.send(); 
		request.onerror = reject;

		request.onload = () => {
			if (request.status < 400){ // status http 200: success; status http 400: client error.
			}
				resolve(JSON.parse(request.responseText));
		};
	});
}


let diagData = null;

// esta função deve ser chamada globalmente num evento do jogo, para que os dados de diálogo sejam carregados paralelamente aos demais eventos.
async function loadAllDialogs() {
    diagData = await loadDiagJSON(path);
}

function getDiag(scene, character, dialogue) {
    const lines = diagData[scene][character][dialogue];
	
	const fullText = lines.join("\n");

    $gameMessage.add(fullText);

	$gameMessage.newPage(); // faz com que a messagebox atual termine e passe pra próxima página (o próximo diálogo começará em uma página diferente, no caso)
}

function setEventDirectionFix(eventId, state){
	const event = $gameMap.event(eventId);
		if (event) {
			event.setDirectionFix(state);
		}
}

function resetEventDirectionFix(eventId){
	const TerminateMessage = Window_Message.prototype.terminateMessage;

	Window_Message.prototype.terminateMessage = function() {
		TerminateMessage.call(this); // this se refere à mensagem atual no display/window.

		setEventDirectionFix(eventId, false);
	};
}

function moveTo(npc, target){
	Game_Character.prototype.moveTowardTarget = function(target) {
		if (!target) return;
		if (this.isMoving()) return; // previne o npc de teleportar direto pro target (por conta que a função roda a cada frame )

		const direction = this.findDirectionTo(target.x, target.y);

		if (direction > 0) {
			this.moveStraight(direction);
		}
	};
	
	npc.moveTowardTarget(target);
}


// Some basic documentation (documentação básica):
// new XMLHttpRequest(): is a request object, used to fetch files.
// .open('GET', path): opens a http protocol with GET method: it's like doing a GET request to a server, but to a file path
// .send(): after the protocol is opened, we send the request.
// .onerror: not mandatory, it just returns something if the request fails. You can use the "reject" parameter from the promise.
// .onload: when the request is loaded, pull the response from it (take notice that the "onload" event is asynchronous, meaning that it will only go to the event loop after it loads, that's why we should wait for it to resolve the promise, then returning the javascript object parsed from the json file).