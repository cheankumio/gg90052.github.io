"use strict";

var rawlist = [];
var withList = [];
var placeList = [];
var uploadURL;
var userid = "";
var lastData = JSON.parse(localStorage.getItem("posts"));
if (lastData) {
	rawlist = lastData;
	finish();
}

$(".update").click(function () {
	FB.login(function (response) {
		callback(response);
	}, { scope: 'user_posts', return_scopes: true });
});

$(".goSearch").click(function (e) {
	$(this).removeClass("noresult");
	$(this).blur();
	filterInit($(".search"));
	var word = $(".search").val();
	var newList = filter('message', word);
	if (newList.length == 0) {
		$(this).addClass("noresult");
	}
	renderList(newList);
});

$(".place select").change(function () {
	var val = $(this).val();
	if (val) {
		if (val == 'undefined') {
			val = $(this).find(":selected").text();
		}
		filterInit($(this));
		var newList = filter('place', val);
		$(this).blur();
		renderList(newList);
	}
});

$(".with select").change(function () {
	var val = $(this).val();
	if (val) {
		filterInit($(this));
		var newList = filter('with_tags', val);
		$(this).blur();
		renderList(newList);
	}
});

$(".stat").click(function () {
	$(".statistics").removeClass('hide').click(function (e) {
		if ($(e.target).hasClass('statistics')) {
			$(".statistics").addClass('hide');
			$(".statistics").off('click');
		}
	});
	$(".statistics .header .close").click(function () {
		$(".statistics").addClass('hide');
		$(".statistics").off('click');
	});
});

function callback(response) {
	if (response.status === 'connected') {
		if (response.authResponse.grantedScopes.indexOf('user_posts') >= 0) {
			getList();
		} else {
			alert("需要完整授權，請再試一次");
		}
	} else {
		FB.login(function (response) {
			callback(response);
		}, { scope: 'user_posts', return_scopes: true });
	}
}

function getList() {
	$("#feeds").html("");
	rawlist = [];
	$(".waiting").removeClass("hide");
	FB.api("https://graph.facebook.com/v2.7/me/posts?fields=source,link,status_type,message_tags,with_tags,place,full_picture,created_time,from,message&limit=50", function (res) {
		userid = res.data[0].from.id;
		for (var i = 0; i < res.data.length; i++) {
			var obj = res.data[i];
			obj.origin_time = obj.created_time;
			obj.created_time = timeConverter(obj.created_time);
			rawlist.push(obj);
		}
		if (res.paging) {
			if (res.paging.next) {
				getNext(res.paging.next);
			} else {
				finish();
			}
		} else {
			finish();
		}
	});
}

function getNext(url) {
	$.getJSON(url, function (res) {
		for (var i = 0; i < res.data.length; i++) {
			var obj = res.data[i];
			obj.origin_time = obj.created_time;
			obj.created_time = timeConverter(obj.created_time);
			rawlist.push(obj);
		}
		$(".console .message").text('已截取  ' + rawlist.length + ' 筆資料...');
		if (res.paging) {
			if (res.paging.next) {
				getNext(res.paging.next);
			} else {
				finish();
			}
		} else {
			finish();
		}
	});
}

function genData(obj) {
	var src = obj.full_picture || 'http://placehold.it/300x225';
	var ids = obj.id.split("_");
	var link = 'https://www.facebook.com/' + ids[0] + '/posts/' + ids[1];
	var withTag = "";
	var place = "";
	var addition = "";
	if (obj.with_tags) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = obj.with_tags.data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var i = _step.value;

				if (JSON.stringify(withList).indexOf(i.id) === -1) {
					withList.push(i);
				}
				withTag += i.name + "、";
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		withTag = withTag.slice(0, -1);
		addition += "和 " + withTag;
	}
	if (obj.place) {
		if (JSON.stringify(placeList).indexOf(obj.place.id) === -1) {
			placeList.push(obj.place);
		}
		place = obj.place.name;
		addition += " 在 " + place;
	}

	var mess = obj.message ? obj.message.replace(/\n/g, "<br />") : "";
	var str = "<div class=\"card\">\n\t\t\t\t<a href=\"" + link + "\" target=\"_blank\">\n\t\t\t\t\t<div class=\"card-image\">\n\t\t\t\t\t\t<figure class=\"image is-4by3\">\n\t\t\t\t\t\t\t<img src=\"" + src + "\" alt=\"\">\n\t\t\t\t\t\t</figure>\n\t\t\t\t\t</div>\n\t\t\t\t</a>\n\t\t\t\t<div class=\"card-content\">\n\t\t\t\t\t<div class=\"content\">\n\t\t\t\t\t\t" + mess + "\n\t\t\t\t\t\t<br>\n\t\t\t\t\t\t<a href=\"" + link + "\" target=\"_blank\"><small>" + obj.created_time + "</small></a>\n\t\t\t\t\t\t<div class=\"message\">" + addition + "</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>";
	return str;
}

function finish() {
	// console.log(rawlist);
	$(".waiting").addClass("hide");
	$('input.time').bootstrapMaterialDatePicker({
		weekStart: 0,
		format: 'YYYY/MM/DD',
		time: false,
		maxDate: rawlist[0].created_time,
		minDate: rawlist[rawlist.length - 1].created_time
	}).on('change', function (e, date) {
		var start = Date.parse($("input.start").val());
		var end = Date.parse($("input.end").val());
		if (start && end) {
			$(".ui select, .ui input:not(.time)").val("");
			if (start > end) {
				var temp = start;
				start = end;
				end = temp;
			}
			var newList = filterTime(start, end);
			renderList(newList);
		}
	});

	$(".with select").html("").append("<option value=\"\">請選擇</option><option value=\"allWith\">顯示全部</option>");
	$(".place select").html("").append("<option value=\"\">請選擇</option><option value=\"allPlace\">顯示全部</option>");

	genSelect(rawlist);
	renderList(rawlist.slice(0, 25));
	localStorage.setItem("posts", JSON.stringify(rawlist));
	$("button").removeClass("is-loading");
	genStat();
	// alert("完成");
}

function genSelect(list) {
	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			var obj = _step2.value;

			if (obj.with_tags) {
				var _iteratorNormalCompletion5 = true;
				var _didIteratorError5 = false;
				var _iteratorError5 = undefined;

				try {
					for (var _iterator5 = obj.with_tags.data[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
						var i = _step5.value;

						if (JSON.stringify(withList).indexOf(i.id) === -1) {
							withList.push(i);
						}
					}
				} catch (err) {
					_didIteratorError5 = true;
					_iteratorError5 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion5 && _iterator5.return) {
							_iterator5.return();
						}
					} finally {
						if (_didIteratorError5) {
							throw _iteratorError5;
						}
					}
				}
			}
			if (obj.place) {
				if (JSON.stringify(placeList).indexOf(obj.place.id) === -1) {
					placeList.push(obj.place);
				}
			}
		}
	} catch (err) {
		_didIteratorError2 = true;
		_iteratorError2 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion2 && _iterator2.return) {
				_iterator2.return();
			}
		} finally {
			if (_didIteratorError2) {
				throw _iteratorError2;
			}
		}
	}

	var _iteratorNormalCompletion3 = true;
	var _didIteratorError3 = false;
	var _iteratorError3 = undefined;

	try {
		for (var _iterator3 = withList[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
			var _i = _step3.value;

			$(".with select").append("<option value=\"" + _i.id + "\">" + _i.name + "</option>");
		}
	} catch (err) {
		_didIteratorError3 = true;
		_iteratorError3 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion3 && _iterator3.return) {
				_iterator3.return();
			}
		} finally {
			if (_didIteratorError3) {
				throw _iteratorError3;
			}
		}
	}

	var _iteratorNormalCompletion4 = true;
	var _didIteratorError4 = false;
	var _iteratorError4 = undefined;

	try {
		for (var _iterator4 = placeList[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
			var _i2 = _step4.value;

			$(".place select").append("<option value=\"" + _i2.id + "\">" + _i2.name + "</option>");
		}
	} catch (err) {
		_didIteratorError4 = true;
		_iteratorError4 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion4 && _iterator4.return) {
				_iterator4.return();
			}
		} finally {
			if (_didIteratorError4) {
				throw _iteratorError4;
			}
		}
	}
}

function renderList(list) {
	$("#feeds").html("");
	for (var i = 0; i < list.length; i++) {
		var obj = list[i];
		var str = genData(obj);
		$("#feeds").append(str);
	}
}

function timeConverter(UNIX_timestamp) {
	var a = moment(UNIX_timestamp)._d;
	var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	if (date < 10) {
		date = "0" + date;
	}
	if (min < 10) {
		min = "0" + min;
	}
	var sec = a.getSeconds();
	if (sec < 10) {
		sec = "0" + sec;
	}
	var time = year + '-' + month + '-' + date + " " + hour + ':' + min + ':' + sec;
	return time;
}

function filter(key, value) {
	var arr = [];
	if (value == 'allWith') {
		arr = $.grep(rawlist, function (obj) {
			return obj.with_tags;
		});
	} else if (value == 'allPlace') {
		arr = $.grep(rawlist, function (obj) {
			return obj.place;
		});
	} else {
		arr = $.grep(rawlist, function (obj) {
			var target = obj[key] || "";
			return JSON.stringify(target).indexOf(value) >= 0;
		});
	}
	return arr;
}

function filterTime(start, end) {
	var arr = $.grep(rawlist, function (obj) {
		var time = Date.parse(obj.created_time.substr(0, 10));
		return time >= start && time <= end + 86399000;
	});
	return arr;
}

function filterInit(tar) {
	var val = tar.val();
	$(".ui select, .ui input").val("");
	tar.val(val);
}

function genStat() {
	$(".shareCard .picture").html("");
	$(".shareCard .other").html("");
	var totalWords = 0;
	var _iteratorNormalCompletion6 = true;
	var _didIteratorError6 = false;
	var _iteratorError6 = undefined;

	try {
		for (var _iterator6 = rawlist[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
			var i = _step6.value;

			if (i.message) {
				totalWords += i.message.length;
			}
		}
	} catch (err) {
		_didIteratorError6 = true;
		_iteratorError6 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion6 && _iterator6.return) {
				_iterator6.return();
			}
		} finally {
			if (_didIteratorError6) {
				throw _iteratorError6;
			}
		}
	}

	moment.locale('zh_tw');
	var regTime = moment(rawlist[rawlist.length - 1].created_time).toNow(true);

	$(".shareCard .picture").append("<img crossOrigin=\"Anonymous\" id=\"profile_pic\" src=\"http://graph.facebook.com/" + rawlist[0].from.id + "/picture?width=150&height=180\" />");
	// $(".shareCard .other").append(`<p>從 ${rawlist[rawlist.length-1].created_time.substr(0,10)} 在 Facebook 發表第一篇貼文</p>`);
	// $(".shareCard .other").append(`<p>在 ${regTime} 來發了 ${rawlist.length} 篇貼文，共 ${totalWords} 字</p>`);
	// $(".shareCard .other").append(`<p>曾和 ${withList.length} 位朋友一同出遊 </p>`);
	// $(".shareCard .other").append(`<p>在 ${placeList.length} 地方打過卡 </p>`);

	$(".shareCard .other").append("<p><span class=\"list\">第一篇貼文時間：</span><span class=\"listValue\">" + rawlist[rawlist.length - 1].created_time.substr(0, 10) + "</span></p>");
	$(".shareCard .other").append("<p><span class=\"list\">總發文篇數：</span><span class=\"listValue\">" + rawlist.length + " 篇</span></p>");
	$(".shareCard .other").append("<p><span class=\"list\">總發文字數：</span><span class=\"listValue\">" + totalWords + " 字</span></p>");
	$(".shareCard .other").append("<p><span class=\"list\">打卡總人數：</span><span class=\"listValue\">" + withList.length + " 人</span></p>");
	$(".shareCard .other").append("<p><span class=\"list\">打卡地點數：</span><span class=\"listValue\">" + placeList.length + "</span></p>");
}

function drawCard() {
	var canvas = new fabric.StaticCanvas('canvas');
	canvas.setBackgroundColor('#FFF');

	var header = new fabric.Rect({
		left: 0,
		top: 0,
		fill: '#3B5998',
		width: 560,
		height: 60
	});
	canvas.add(header);

	var userPic = new fabric.Image(document.getElementById('profile_pic'), {
		left: 24,
		top: 87
	});
	canvas.add(userPic);

	var headerWord = new fabric.Text("我的 Facebook 發文統計資料", {
		fontFamily: "Microsoft JhengHei",
		fill: '#FFF',
		fontSize: 25.2,
		left: 21,
		top: 18
	});
	canvas.add(headerWord);

	var statWords = "";
	$(".shareCard .other p").each(function () {
		statWords += $(this).text() + '\n';
	});
	var word = new fabric.Text(statWords, {
		fontFamily: "Microsoft JhengHei",
		fill: '#69707a',
		fontSize: 18,
		lineHeight: 1.5,
		left: 200,
		top: 90
	});
	canvas.add(word);

	var base64 = canvas.toDataURL({
		format: 'png'
	});
	base64 = base64.replace('data:image/png;base64,', '');

	$.ajax({
		url: "https://api.imgur.com/3/image",
		beforeSend: function beforeSend(xhr) {
			xhr.setRequestHeader("Authorization", "Client-ID 7c6851ef3aa42cc");
		},
		type: 'POST',
		datatype: "json",
		data: {
			'image': base64,
			'album': 'JvjTJwh1eAnuSQi',
			'title': rawlist[0].from.id
		},
		success: function success(result) {
			var id = result.data.id;
			uploadURL = 'http://imgur.com/' + id + '.png';
		}
	});
}

$(".goShare").click(function () {
	drawCard();
	$(".goShare").addClass('is-disabled').text('產生圖片中...請稍候');
	postLink();
});

function checkMobile() {
	var check = false;
	(function (a) {
		if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
	})(navigator.userAgent || navigator.vendor || window.opera);
	return check;
}

function postLink() {
	var t = setInterval(function () {
		if (uploadURL) {
			clearInterval(t);
			if (checkMobile()) {
				location.href = "http://www.facebook.com/dialog/feed?client_id=1808267469406478&picture=" + uploadURL + "&link=http://gg90052.github.io/fb_mypost/&redirect_uri=http://gg90052.github.io/fb_mypost/&display=touch";
			} else {
				FB.ui({
					app_id: '1808267469406478',
					method: 'feed',
					link: 'http://gg90052.github.io/fb_mypost/',
					picture: uploadURL
				}, function (response) {
					$(".goShare").addClass('hide');
				});
			}
		}
	}, 1000);
}