angular.module("templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("game/game.html","	<h1>{{gamedatas.name}} <span class=\"small\">({{gamedatas.id}})</span></h1>\r\n	<div ng-controller=\"Chrono\">\r\n		<span class=\"muted\">{{qt}}</span> : <strong>{{chrono}}</strong>\r\n		<br><a ng-click=\"play()\" ng-hide=\"isplaying\">Play</a><a ng-click=\"stop()\" ng-show=\"isplaying\">Stop</a>\r\n	</div>");
$templateCache.put("gameconfig/gameconfig.html","<form action=\"/\">\n	<div class=\"form-group\">\n		<label for=\"id\">Id</label>\n		<input class=\"form-control\" id=\"id\" type=\"text\" id=\"id\" ng-model=\"gamedatas.id\" placeholder=\"No id ?!\" disabled>\n	</div>\n	<div class=\"form-group\">\n		<label for=\"name\">Name</label>\n		<input class=\"form-control\" id=\"name\" type=\"text\" ng-model=\"gamedatas.name\" placeholder=\"Stat sheet\'s name\">\n	</div>\n	<fiedset>\n		<div class=\"row\">\n			<div class=\"col-xs-12 col-lg-6\">\n				<div class=\"form-group\">\n					<label for=\"nb_periods\">Number of periods</label>\n					<input type=\"number\" class=\"form-control\" id=\"nb_periods\" ng-model=\"gamedatas.nb_periods\" placeholder=\"4\">\n				</div>\n			</div>\n			<div class=\"col-xs-12 col-lg-6\">\n				<div class=\"form-group\">\n					<label for=\"periods_time\">Length of each periode</label>\n					<div class=\"input-group\">\n						<input type=\"number\" class=\"form-control\" id=\"periods_time\" ng-model=\"gamedatas.periods_time\" placeholder=\"10\">\n						<div class=\"input-group-addon\">minutes</div>\n		   			</div>\n				</div>\n			</div>\n		</div>\n	</fieldset>\n	<button type=\"submit\" class=\"btn btn-default\" ng-click=\"save()\">Submit</button>\n</form>");
$templateCache.put("main/main.html","<p><a href=\"#/gameconfig/new\">New game</a></p>\n<p>List of games :</p>\n<ul>\n    <li ng-repeat=\"game in gamesdatas\">\n    {{game.id}}-<a href=\"#/game/{{game.id}}\">{{game.name}}</a> - <a href=\"#/gameconfig/{{game.id}}\">Edit</a>\n    </li>\n</ul>");}]);