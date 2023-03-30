const mavka = getMavka();
const context = getContext();

import path from "path";
import fs from "fs";

function envParse(env) {
	const variables = [];

	for (const variable of env.split("\n")){
		const entities = variable.match(/(.*?)=(.*)/)

		if (!entities[1].match(/^[a-zA-Z_]*$/))
			return mavka.fall(context, mavka.makeText("ключ не є валідним"));

		if (entities[2] == '')
			return mavka.fall(context, mavka.makeText('значення елементу не може бути пустим'))

		variables.push([entities[1], entities[2]]);
	}

	return variables;
}

context.set('взяти_змінні_середовища', mavka.makeWrappedProxyFunction(() => {
	const env = Object.entries(process.env);

	return mavka.makePortalList(env);
}));

context.set('читати_змінні_з_файлу', mavka.makeWrappedProxyFunction(([path]) => {

	if (!fs.existsSync(path))
		return mavka.fall(context, mavka.makeText("немає такого файлу за вказаним вами шляхом"));

	if(!path.endsWith('.env'))
		return mavka.fall(context, mavka.makeText("файл не є файлом змінних середовища"));

	const data = fs.readFileSync(path, 'utf-8');

	return mavka.makePortalList(envParse(data));
}));

context.set('повернути_дану_папку', mavka.makeWrappedProxyFunction(() => {
	return mavka.makeText(process.cwd());
}));

context.set('отримати_повний_шлях', mavka.makeWrappedProxyFunction(([thisFolder, localPath]) => {
	return mavka.makeText(path.join(thisFolder, localPath));
}));


await mavka.eval(`
	модуль ЗмінніСередовища

		данна_папка = повернути_дану_папку()

		дія повернути_змінні(взяті_змінні)

			масив_елементів = []
			змінні_оточення = ()

			перебрати взяті_змінні як елемент
				перебрати елемент як ключ
					масив_елементів.додати(ключ)
				кінець
			кінець

			число = 0

			поки число не рівно масив_елементів.довжина()
				змінні_оточення.покласти(масив_елементів[число], масив_елементів[число+1])

				число += 2
			кінець

			вернути змінні_оточення

		кінець

		дія повернути_системні()
			вернути повернути_змінні(взяти_змінні_середовища())
		кінець

		дія повернути_з_файлу(шлях_до_файлу текст)
			шлях_до_файлу = отримати_повний_шлях(ЗмінніСередовища.данна_папка, шлях_до_файлу)

			файл = читати_змінні_з_файлу(шлях_до_файлу)

			вернути повернути_змінні(файл)
		кінець

		дати повернути_системні
		дати повернути_з_файлу
		дати данна_папка
	кінець

	дати ЗмінніСередовища
	`, context)