#### `http://geoworks.pro:3000/<function>`

Каждый успешный ответ содержит JSON объект или файл. В JSON объекте всегда присутствует поле `ok` (true/false). Если false - в ответе будет код ошибки и текстовое описание.


## Режимы работы
Устрйоство имеет 2 режима работы:
* `рабочий` - доступные все возможности, при этом высокое энергопотребление.
* `сон` - энергосбережение. Доступна только команда `/wakeup`.

Если компьютеру не поступает никаких команд, компьютер переходит в режим `сон` через 5 минут после приятия последней команды.
Если нужно поддержать активный режим (отложить переход в "сон" - см. команду `/nosleep`).
Если компьютер нужно из режимы "сна" перевести в "рабочий", нужно сначала "разбудить" компьютер (см. команду `/wakeup`).
Если вашему приложению нужно знать о моментах смены режимов, изучите раздел `webhooks`.


## Functions
##### `state`
Возвращает массив объектов, содержащих информацию о всех устройствах и их состоянии.
|Поле|Варианты/тип|Описание|
|---|---|---|
|`up`|`true`|Включено, готово к работе|
| |`false`|Выключено, режим "сон"|
| |`null`|Неопределено (возможно при переходе между состояниями)|
|`charge`|float number|Текущий заряд АКБ (0-1)|
|`devid`|int number|ID|
|`label`|string|Метка|

##### `<dev>/wakeup`
Устанавливает флаг на пробуждение для девайса с `id`=`<dev>`. Устройство будет готово к работе через 90 сек.

Пример запроса: `http://geoworks.pro:3000/3/wakeup`

##### `<dev>/photo`
Снимает фото. После успешного выполнения возвращется файл в формате JPG. Если возникла ошибка, возвращается JSON объект с описанием ошибки.

Пример ответа с ошибкой: `{"ok":false,"error":{"code":503,"text":"cam is busy"}}`

##### `<dev>/video`
Параметры:
+ duration (integer, required) - Длительность видео в секундах. Должно быть > 0
Снимает видео длительностью *duration* секунд и отдаёт файл (h264) в ответ. При неудаче JSON с описанием ошибки.

Пример: `http://geoworks.pro:3000/infDev1/video?duration=30`

##### `<dev>/stream/start`
Запускает видео трансляцию. Возвращает JSON объект (успех/неудача).

##### `<dev>/stream/stop`
Останавливает видео трансляцию. Возвращает JSON объект (успех/неудача).

##### `<dev>/sensors`
Считывает значения датчиков отдаёт JSON объект, содержащий значения или ошибку.

##### `<dev>/diag`
Возвращает диагностическую информацию об устройстве:
+ id (string)
+ время устройства (string)
+ геопозиция (string)
+ уровень заряда (float(2) 0-1)
+ аптайм в секундах (int)
+ количество ошибок (int)
+ текущее действие (enum string). Возможные значения:
	+ `wait`
	+ `shooting Photo`
	+ `shooting Video`
	+ `streaming Video`

##### `<dev>/nosleep`
Совершает сброс таймера перехода в "сон". Пригодится в случае, если нужно поддержать рабочий режим. Переход в режим сна произойдёт через 5 мин после отправки ответа `{ok: true}`.

## Webhooks
Если вашему приложению нужно получать уведомления о смене статуса устройств, используйте механизм webhooks.
В момент когда произойдёт нужное вам событие, наш сервер отправит get запрос на нужный вам URL.
Чтобы начать получать уведомления, нужно *один раз* подписаться на уведомления.

##### `/webhook/<dev>/<event>`
Список событий:
* wakeup
* sleep

Cоздаёт подписку уведомлений нужного события на ваш URL. Возвращает ответ об успешной или неуспешной подписке.


Параметры:
+ url (string, required) - URL вызываемые при возникновении события

Пример запроса: `http://geoworks.pro:3000/webhook/3/wakeup?url=http://mysite.ru/wake.php`
После успешного овтета на этоот запрос при каждом переходе в "рабочий" режим устройства с `ID`=`3` будет отправляться GET запрос на `http://mysite.ru/wake.php`

* * *

Если у вас остались вопросы или возникли трудности, задавайте их в нашей группе в [VK/sunputer](https://vk.com/sunputer)
