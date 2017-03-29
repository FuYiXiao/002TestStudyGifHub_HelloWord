$(function () {
	function ResizeDom(){
		///为了拖动到最右边再往右的时候能出现滚动条
		var width = $("#modelDefDiv").parent().width();
		var height = $("#modelDefDiv").parent().height();
		$("#modelDefDiv").width(width - 5);
		$("#modelDefDiv").height(height - 5);
	}　
	$(window).resize(function(){
		ResizeDom();
	});
	ResizeDom();
});

Model = {
	ModeType				: {
		DTree		: 0,// 决策树
		LRegressor	: 1,// 权重模型
		Complex		: 2
		// 混合模型
	},
	ElementType				: {
		ZB		: 0,// 指标
		ZBY		: 1,// 指标元
		MX		: 2,// 模型
		YJFJ	: 3,// 预警分级节点
		LJXJD	: 7,// 连接线节点 折线
		QZJD	: 8,// 权重节点
		JSJD	: 9// 结束节点
	},
	type			: {
		Node	: "Node",// 节点
		Line	: "Line",// 线
		Canvas  : "Canvas"  //画布
	},
	LXBM					: {
		ZBDFJD	: "BASE.MX.MXJD.ZBDFJD", //指标得分结点
		MXDFJD	: "BASE.MX.MXJD.MXDFJD", //模型得分结点
		ZMXJD	: "BASE.MX.MXJD.ZMXJD",  //子模型结点
		GLMXJD	: "BASE.MX.MXJD.GLMXJD", //过滤模型结点
		BJJD	: "BASE.MX.MXJD.BJJD"	//标记结点
	},
	GSLX					: {
		SZ	: 0,// 数值
		ZF	: 1,// 字符
		LJ	: 2,// 逻辑
		RQ	: 3// 日期
	},
	LineType				: {
		PolyLine	: "Flowchart",
		Line		: "Straight"
	},
    Status                  : {
        EDIT        : "edit",
        VIEW        : "view",
        ADJUST      : "adjust",
        ADJUSTANDDEL: "adjustAndDel"
    },
	DefaultExtensionLineLength : 30,
	idField					: "code",
	textField				: "name",
	$cual_span				: $("#cual_span"),
	canvasManagers			: [],
	JsPlumbDefault	        : {// 样式定义
		// point样式
		paintStyle				: {
			strokeStyle	: "transparent",
			fillStyle	: "transparent",
			radius		: 2,
			lineWidth	: 1
		},
		// point样式-hover
		hoverPaintStyle			: {
			strokeStyle	: "green",
			fillStyle	: "green",
			radius		: 5,
			lineWidth	: 2
		},
		//选中样式
		activePaintStyle			: {
			strokeStyle	: "#228B22",
			fillStyle	: "#228B22",
			radius		: 5,
			lineWidth	: 2
		},
		// 连接线样式
		connectorStyle			: {
			lineWidth	: 2,
			strokeStyle	: "#3693EF"
		},
		// 连接线鼠标浮动样式
		connectorHoverStyle		: {
			lineWidth	: 2,
			strokeStyle	: "#D60C0C"
		},
		// 线接线线形
		connector				: "Flowchart",
		connectionOverlays		: [["Arrow", {
			id			: "arrow",
			location	: 1,
			width		: 7,
			length		: 7,
			foldback	: 0.80
		}]],
		connectionOverlaysLabel		: ["Label", {
		    id			: "label",
		    cssClass	: "aLabel",
			location	: 0.3
		}]
	},
	currentLineType : "Flowchart",//当前线型
	/**
	 * 获取当前画布
	 */
	getCurrentCanvasManager	: function() {
		var len = Model.canvasManagers.length;
		if (len > 0) {
			return Model.canvasManagers[len - 1];
		}
		return null;
	},
	/**
	 * 获取nodeType，与Model.NodeType配置相关
	 * 
	 * @param {String}
	 *            lxdm 节点的操作类型（根据其双击效果分类）
	 * @param {int}
	 *            elementType 节点的元素类型，见Model.ElementType配置
	 * @return {String} nodeType
	 */
	getNodeType				: function(lxdm, elementType) {// 与Model.NodeType相关
		var nodeType = "";
		if (elementType == Model.ElementType.ZB || elementType == Model.ElementType.ZBY) {// 指标打分节点
			nodeType = "ZBJD";
		} else if (elementType == Model.ElementType.MX) {// 子模型节点
			nodeType = "ZMXJD";
		} else if (elementType == Model.ElementType.LJXJD) {// 连接线节点
			nodeType = "LJXJD";
		} else if (lxdm == Model.LXBM.MXDFJD) {// 模型打分节点
			if (elementType == Model.ElementType.QZJD) {
				nodeType = "QZJD";
			} else if (elementType == Model.ElementType.JSJD) {
				nodeType = "JSJD";
			}
		} else if (lxdm = Model.LXBM.BJJD) {// 标记节点
			nodeType = "JSJD";
		}
		return nodeType;
	},

	getDefaulLineType		: function() {
		return Model.LineType.PolyLine;
	},
	getNewLineType			: function(curType) {
		return curType == Model.LineType.Line ? Model.LineType.PolyLine : Model.LineType.Line;
	},
    destroy                 : function(){
        delete Model.canvasManagers;
        Model.$cual_span.remove(); 
        delete Model.$cual_span;
    },
	uuid						: function(len, radix) {
		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''), uuid = [], i;
		radix = radix || chars.length;

		if (len) {
			for (i = 0; i < len; i++) {
				uuid[i] = chars[0 | Math.random() * radix];
			}
		} else {
			var r;

			uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
			uuid[14] = '4';

			for (i = 0; i < 36; i++) {
				if (!uuid[i]) {
					r = 0 | Math.random() * 16;
					uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
				}
			}
		}

		return uuid.join('');
	},
	/**
	 * 设置source没有浮动样式
	 *
	 * @param {}
	 *            connector
	 */
	clearSourceHoverPaintStyle	: function(connector) {
		connector.endpoints[0].setHoverPaintStyle(Model.JsPlumbDefault.paintStyle);
	}
};
Model.Elements = {
	ZBJD: {      //指标 0
		isSource		: true, // 是否可以拖动（作为连线起点）
		isTarget		: true, // 是否可以放置（作为连线终点）
		iconCls         : "start",//图标样式
		nodeClass       : "sl_box node",   //元素样式
		name			: "",
		nodeClassWrapShow   : "js-change-stype",   //元素样式
		data			: {}
	},
	ZMXJD: {   //模型 2
		isSource			: true, // 是否可以拖动（作为连线起点）
		isTarget			: true, // 是否可以放置（作为连线终点）
		iconCls         	: "start",//图标样式
		nodeClass       	: "mx_box node",   //元素样式
		name				: "模型",
		nodeClassWrapShow   : "js-change-stype",   //元素样式
		data				: {}
	},
	LJXJD: {   //连接线节点 7
		iconCls         : "",//图标样式
		name            : "",
		nodeClassWrapShow   : "js-change-stype",   //元素样式
		data			: {}
	},
	QZJD: {   //权重设置节点  8
		isSource		: false, // 是否可以拖动（作为连线起点）
		isTarget		: false, // 是否可以放置（作为连线终点）
		iconCls         : "",//图标样式
		nodeClass       : "qz_box node",   //元素样式
		name            : "权重设置",
		nodeClassWrapShow   : "js-change-stype",   //元素样式
		data			: {}
	},
	JSJD			: {// 结束节点  9
		isSource		: false, // 是否可以拖动（作为连线起点）
		isTarget		: true, // 是否可以放置（作为连线终点）
		iconCls         : "end",//图标样式
		nodeClass       : "node",   //元素样式
		nodeClassWrapShow   : "js-change-stype",   //元素样式
		name            : "",
		data			: {
			/*code       : "endNode"*/
		}
	}
}
Model.ModelCanvas = function(options) {
	this.options = $.extend(this.options, options || {});
	if (!this.options.canvasId) {
		this.$canvas = $('<div style="z-index: 30;position:absolute;top:0;left:0;bottom:0;right:0;_width:100%;_height:100%;overflow:auto;background-color:beige;filter:Alpha(opacity=90); border: black 1px dashed;"></div>')
				.appendTo("body");
	} else {
		this.$canvas = $("#" + this.options.canvasId);
	}

	this.nodes = {};
    this._nodes = [];//节点集合，包括已删除的节点，用于保存节点的添加顺序
	this.virtualNodes = {}; //虚拟节点
    this.selectedEls = {};
	this.editable = (this.options.status == "edit");
	this.canvasWidth = this.$canvas.width();
	this.canvasHeight = this.$canvas.height();
	this.jsPlumbInstance = jsPlumb.getInstance();
	// 默认值初始化
	this.jsPlumbInstance.importDefaults({
		DragOptions			: {
			cursor	: 'pointer',
			zIndex	: 2000
		}, // 拖动时鼠标停留在该元素上显示指针，通过css控制
		Anchor				: "Continuous",
		Endpoint			: ["Dot", {
			radius	: 2
		}],
		EndpointStyle		: Model.JsPlumbDefault.paintStyle,
		EndpointHoverStyle	: Model.JsPlumbDefault.hoverPaintStyle,
		HoverPaintStyle		: Model.JsPlumbDefault.connectorStyle,
		ConnectionOverlays	: Model.JsPlumbDefault.connectionOverlays
	});

	// 注册直线和折线两种线型
	this.jsPlumbInstance.registerConnectionType("Straight", {
		connector		: ["Straight", {
			gap	: 2
		}],
		reattach		: true,
		paintStyle		: Model.JsPlumbDefault.connectorStyle,
		hoverPaintStyle	: Model.JsPlumbDefault.connectorHoverStyle,
		overlays		: Model.JsPlumbDefault.connectionOverlays
	});
	this.jsPlumbInstance.registerConnectionType("Flowchart", {
		connector		: ["Flowchart", {
			gap	: 2
		}],
		reattach		: true,
		paintStyle		: Model.JsPlumbDefault.connectorStyle,
		hoverPaintStyle	: Model.JsPlumbDefault.connectorHoverStyle,
		overlays		: Model.JsPlumbDefault.connectionOverlays
	});

	if (!this.editable) {
		// 不显示连接到
		this.jsPlumbInstance.importDefaults({
			Endpoint	: "Blank"
		});
	}
	this.init();
}
Model.ModelCanvas.prototype = {
	focusEl					: null,
	nodes					: {},// 节点集合,key为id
    _nodes                  : [],//节点集合，包括已删除的节点，用于保存节点的添加顺序
	virtualNodes            : {},//非mxjds内部的节点，如权重模型的指标节点的线条
    selectedEls             : {},//选中node节点，key为id，value为node
	initNodesLen			: 1,// 初始节点数
	toolbarHeight			: 26,
	editable                : false,    //当前模式是否可编辑
	jsPlumbInstance         : {},   //当前jsPlumb对象
	self                    : this,
	currentIfShowWrap		:false,  //当前是否换行显示文本
	
	// 连线起点配置
	sourceOptions		: {
		filter				: ".node_source_icon",
		anchor				: "Continuous",
		reattach			: true,// 悬浮连接线是否还原到原有连接
		maxConnections		: -1,
		connector			: Model.JsPlumbDefault.connector,
		connectorStyle		: Model.JsPlumbDefault.connectorStyle,
		connectorHoverStyle	: Model.JsPlumbDefault.connectorHoverStyle
	},
	// 连线终点配置
	targetOptions		: {
		isTarget	: true,
		anchor		: "Continuous",
		reattach	: true,// 悬浮连接线是否还原到原有连接
		allowLoopback   :false,
		dropOptions	: {
			hoverClass	: "dragHover",
			activeClass	: "dragActive"
		},
		beforeDrop	: function(info) {
			return true;
		}
	},
	init					: function() {
		var data = this.options.data;
		if (!data.mxjds || data.mxjds.length == 0) {
			this._create();
		} else {
			this._init();
		}
		if(!this.isViewMode()) {
			this.bindEvents();
		}

		var scope = this;
		this.$canvas.on("mousedown", function(e) {
			if(e.target.id == scope.options.canvasId) {
				scope.unSelectAll();
			}
		});
	},
    destroy                 : function(){
	    var scope = this;
        this.$canvas.unbind().remove();
        delete this.$canvas;
        for(var id in this.nodes){
            var node = this.nodes[id];
            node.removeData();
            node.unbind().remove();
        }
        delete this.nodes;
	    delete this._nodes;
        
        for(var id in this.virtualNodes){
            var node = this.virtualNodes[id];
            node.removeData();
            node.unbind().remove();
        }
        delete this.virtualNodes;
	    delete this.selectedEls;
        delete this.focusEl;
        delete this.options;
	    $.each(this.jsPlumbInstance.getAllConnections(), function() {
		    scope.jsPlumbInstance.detach(this, false, true, false);
			if(this.unbind&&this.unbind().remove){
				this.unbind().remove();
			}
	    });
    },
	_create					: $.noop,
	_init					: function() {
		var scope = this;
		// 修改 根据data.mxjds绘制
		var nodes = this.getNewNode(this.options.data.mxjds);
		//this.options.data.mxjds = nodes;
		//var nodes = this.options.data.mxjds;
		$.each(nodes, function() {
			scope.createNode(this)
		});
		// 设置前置节点、后置节点、过滤条件显示
		$.each(this.getNodes(), function() {
			var data = scope.getNodeData(this, true);
			data.preElements = data.preElements || [];
			data.folElements = data.folElements || [];
			// 前置节点
			var $preNodes = [];

			$.each(data.preElements, function() {
				var $node = scope.nodes[this] || scope.virtualNodes[this];
				$preNodes.push($node);
			});
			// 后置节点
			var $folNodes = [];
			$.each(data.folElements, function() {
				var $node = scope.nodes[this] || scope.virtualNodes[this];
				$folNodes.push($node);
			});
			this.data("preNodes", $preNodes);
			this.data("folNodes", $folNodes);
		});
	},
	//把连接线节点放到最后
	getNewNode                :   function (data) {
		var szNode = [];
		var szLine = [];
		for(var i = 0; i < data.length; i++) {
			if(data[i].elementType != 7) {
				szNode.push(data[i]);
			} else {
				szLine.push(data[i]);
			}
		}
		for(var i = 0; i < szLine.length; i++) {
			szNode.push(szLine[i]);
		}
		return szNode;
	},
	bindEvents               :   function () {
		var scope = this;
		this.jsPlumbInstance.bind("connectionMoved", function(info) {
			if(info.index == 1) {   //target changed
				var oldTarget = info.originalTargetId;
				var oldSource = info.originalSourceId;
				var conn = scope.jsPlumbInstance.getConnections({
					source: [oldSource],
					target: [oldTarget]
				});
				if(conn) {
					conn = conn[0];
				} else {
					return;
				}
				//del线段的后置节点
				//del source fol
				var $folNodes = $("#" + oldSource).data("folNodes");
				var newFol = [];
				$.each($folNodes, function() {
					if(scope.isLine(this)) {
						if(this.data("lineConn") != conn) {
							newFol.push(this);
						}
					} else {
						newFol.push(this);
					}
				});
				$("#" + oldSource).data("folNodes", newFol);
				//del原target节点的前置节点
				var $preNodes = $("#" + oldTarget).data("preNodes");
				var newPre = [];
				$.each($preNodes, function() {
					if(scope.isLine(this)) {
						if(this.data("lineConn") != conn) {
							newPre.push(this);
						}
					} else {
						newPre.push(this);
					}
				});
				$("#" + oldTarget).data("preNodes", newPre);
				//del _nodes
				var nodeId = scope.getNodeId($(conn.connector.canvas));
				var newNodes = [];
				$.each(scope._nodes, function () {
					if(this != nodeId) {
						newNodes.push(this);
					}
				});
				scope._nodes = newNodes;
				scope.nodes[nodeId] = null;
			}
		});
		this.jsPlumbInstance.bind("connection", function(info) {     //绑定连接事件，权重模型不会进来
			var curMx = scope.getMxType();
			var connector = info.connection;
			if(curMx == Model.ModeType.LRegressor || connector.sourceId == connector.targetId) {    //权重模型不需要进来
				return true;
			}
			var $preEle = $("#" + connector.sourceId); //连接线的前置节点
			var $folEle = $("#" + connector.targetId);     //连接线的后置节点

			var lxbm = Model.LXBM.GLMXJD;
			if(scope.isMxjd($preEle)){
				lxbm = Model.LXBM.BJJD;
			}
			var options = {
				"data"                  : {
					"lxbm"			: lxbm,
					"elementType"	: Model.ElementType.LJXJD,
					"idField"		: Model.idField,
					"code"          : Model.uuid(15),
					"preElements"	: [$preEle.attr("id")],
					"folElements"	: [$folEle.attr("id")],
					"position"      : {
						"lineType": Model.LineType.PolyLine
					}
				}
			};
			var nodeId = options.data.code;
			scope.setNodeData(connector.connector.canvas, options.data);
			scope.nodes[nodeId] = $(connector.connector.canvas);
			scope._nodes.push(nodeId);
			$(connector.connector.canvas).data("lineConn", connector);
			scope.updateLineData(connector);
			//var chk = scope._checkLjx($(connector.connector.canvas), $folEle);
			var chk = scope._checkLjx($(connector.connector.canvas), connector.sourceId, connector.targetId);
			if (chk != "MODEL.LINE_CHECK_PASS") {
				setTimeout(function(){
					scope.removeNode($(connector.connector.canvas));  //校验不通过  删除节点
				}, 10);
				alert(chk);
				return false;
			}
			//绑定新连接线右键菜单事件，权重模型下不开放此功能
			if(curMx != Model.ModeType.LRegressor) {
				connector.bind("contextmenu", function(connection, originalEvent) {
					PopMenu.show(originalEvent, Model.type.Line, connector);
				});
			}
			//绑定新连接线双击事件
			connector.bind("dblclick", function(connection, originalEvent) {
				if(!(curMx == Model.ModeType.Complex && !scope.isZbjd($preEle) && !scope.isZbyjd($preEle))) {        //连接到权重节点的 不绑定双击事件
					scope.bindLineDblClick(connector);
				}
			});
			connector.bind("mousedown", function(connection, originalEvent) {
				scope.setFocus($(connector.connector.canvas), originalEvent);
			});
			return true;
		});
		this.$canvas.on("contextmenu", function(e) {    //绑定画布右键菜单事件
			if(e.target.id == scope.options.canvasId) {
				PopMenu.show(e, null, Model.type.Canvas);
			}
		});
	},
	close					: function() {
		if (!this.options.canvasId) {
			this.$canvas.unbind().remove();
			Model.canvasManagers.pop();
		}
        this.destroy();
	},
	createNode : function(data) {
		var type = Model.getNodeType(data.lxbm, data.elementType);
		var options = $.extend({
			elementType	: type
		}, Model.Elements[type]);

		options.data = $.extend( {}, options.data, data);
		options.data.code = data.code || Model.uuid(15);
		if (!this._beforeCreateNode(options.data)) {
			return;
		}
		var $node = this["_create" + type.substr(0, 1)
		+ type.substr(1).toLocaleLowerCase()].call(this, options);
		var nodeId = "";
		if(type != "LJXJD") {
			nodeId = $node.attr("id");
			options.data.code = nodeId;
			this.setNodeData($node, options.data);
			this.nodes[nodeId] = $node;
		} else {
			nodeId = options.data.code;
			if(!nodeId) {
				nodeId = Model.uuid(15);
			}
			options.data.code = nodeId;
			this.setNodeData($($node.connector.canvas), options.data);
			this.nodes[nodeId] = $($node.connector.canvas);
		}
		this._nodes.push(nodeId);
		return $node;
	},
	//创建节点元素
	_createElNode			: function(options) {
		var scope = this;
		var elId = options.data[Model.idField] || Model.uuid(15);
		var className = options.nodeClass;//"sl_box node";
		var IfShowSourcePoint;
		var labelCss = {
			"max-width"	: "200px"
		};
		if(typeof(options.data.wordWrapType)=="undefined"){
			options.data.wordWrapType=0;
		}
		var classNameWrapShow = options.data.wordWrapType?options.nodeClassWrapShow:"";
		
		// 开始结束节点没有sl_box样式
		if (options.data.elementType == Model.ElementType.JSJD) {
			labelCss = {
				width		: "40px",
				overflow	: "visible"
			};
		}

		var el = $("<div class='" + className + "' id='" + elId + "'>" 
					+ "<div id='" + elId + "_icon' class='" + options.iconCls 
				+ "'></div></div>");
		el.appendTo(this.$canvas);

		if(Model.Status.ADJUSTANDDEL==this.options.status||Model.Status.EDIT==this.options.status){
			IfShowSourcePoint = true;
		}else{
			IfShowSourcePoint = false;
		}
		//Model.ModeType.LRegressor　权重模型
		if (options.isSource && IfShowSourcePoint && this.getMxType() != Model.ModeType.LRegressor) {
			$("<div class='node_source_icon " + options.iconCls + "_source'></div>").appendTo(el);
		}

		// label
		var label = $("<div id='" + elId + "_label' class='node_label " + classNameWrapShow +"' ></div>");
		label.appendTo(el);
		label.css(labelCss);
		this.setLabelNode(label, options.data[Model.textField] || options.name || "");
		// 定位
		if (options.data.position) {
			el.css(options.data.position);
		}
		// 节点拖动
		if (!this.isViewMode()) {
			if(options.data.elementType != Model.ElementType.JSJD &&
				options.data.elementType != Model.ElementType.QZJD) {     //绑定右键菜单事件
				el.bind("contextmenu", function(e) {
					PopMenu.show(e, Model.type.Node, el);
				}).bind("mousedown", function (e) {
					scope.setFocus(el, e);
				});
			}
			this.jsPlumbInstance.draggable(el, {
				containment	: "body",
				stop:function(event){
					var $dragNode = el;
					var nodeData = scope.getNodeData($dragNode, true);
					nodeData.position.left = scope.$canvas.scrollLeft() + $dragNode.offset().left + "px";
					nodeData.position.top = scope.$canvas.scrollTop() + $dragNode.offset().top + "px";
					scope.setNodeData($dragNode, nodeData);
				}
			});
		}
		return el;
	},
	//让创建的元素可以连接
	_createConnectionNode	: function(el, options) {
		if(this.getMxType() == Model.ModeType.LRegressor) { //权重模型不能手动画线
			return;
		}
		if (options.isSource) {
			this.jsPlumbInstance.makeSource(el, this.sourceOptions, {
				hoverPaintStyle	: Model.JsPlumbDefault.paintStyle
			});
		}
		if (options.isTarget) {
			this.jsPlumbInstance.makeTarget(el, this.targetOptions);
		}
	},
	//绑定连接线双击事件
	bindLineDblClick    : function (connector) {
		var data = this.getNodeData($("#"+connector.sourceId), true);
		var zbdm = data.elementCode;    // 获取连接线起点处的指标代码
		var sjlx = data.sjlx;   // 获取连接线起点处的指标数据类型
		// 弹出层显示位置
		var position = $(connector.connector.canvas).position();
		position.left = position.left + $(connector.connector.canvas).width();
		if (Model.GSLX.LJ == sjlx) {
			Sxtjsz.showBoolWin(Model.GSLX.LJ, position, zbdm, connector);
		} else {
			Sxtjsz.showFormula(Model.GSLX.LJ, zbdm, connector);
		}
	},
	setLabelNode			: function($node, label) {
		// 长度大于20则省略号显示，一个中文长度为2，此处采用将中文替换为xx的计算方式
		if (label.replace(/[^\x00-\xff]/g, "xx").length > 20) {
			$node.attr("title", label);
		} else {
			$node.removeAttr("title");
		}
		if (label.length == 0) {
			$node.css("width", "auto");
		}
		$node.text(label);
	},
	//修改线条上的名称
	showLineInfo            : function (connector, szLabel) {
		if(!szLabel) {
			return;
		}
		try {
			var $label = connector.getOverlay("label");
			if(!$label) {   //新创建的连接线是没有label的
				connector.addOverlay(Model.JsPlumbDefault.connectionOverlaysLabel);
				$label = connector.getOverlay("label");
			}
			$label.setLabel(szLabel + "");
			$label.canvas.title = szLabel;
		}
		catch(e) {
			var connectorEx = connector.data("lineConn");//this.oLines[nodeData.code];
			var $label = connectorEx.getOverlay("label");
			if(!$label) {   //新创建的连接线是没有label的
				connectorEx.addOverlay(Model.JsPlumbDefault.connectionOverlaysLabel);
				$label = connectorEx.getOverlay("label");
			}
			$label.setLabel(szLabel + "");
			$label.canvas.title = szLabel;
		}
	},
	/**
	 * 连接节点与节点
	 *
	 * @param {}
	 *            line
	 */
	_connect					: function(preEle, folEle, lineType, label,options) {
		var scope = this;
		label = label || "";

		if(typeof(options.data.wordWrapType)=="undefined"){
			options.data.wordWrapType=0;
		}
		var connector = this.jsPlumbInstance.connect({
			source	    : preEle,
			target	    : folEle,
			type	    : lineType
		});

		if(label != "") {
			connector.addOverlay(Model.JsPlumbDefault.connectionOverlaysLabel);
			var $label = connector.getOverlay("label");
			$label.setLabel(label + "");
			$label.canvas.title = label;
			if(options.data.wordWrapType){
				$label.addClass(options.nodeClassWrapShow)
			}
		}
		if(!this.isViewMode()) {
			if(scope.getMxType() != Model.ModeType.LRegressor) {
				connector.bind("contextmenu", function(connection, originalEvent) {
					PopMenu.show(originalEvent, Model.type.Line, connector);
				});
			}
			if(scope.getMxType() != Model.ModeType.LRegressor) {
				connector.bind("mousedown", function(connection, originalEvent) {
					scope.setFocus($(connector.connector.canvas), originalEvent);
				});
			}
		}
		$(connector.connector.canvas).data("lineConn", connector);    //保存connector对象
		Model.clearSourceHoverPaintStyle(connector);
		return connector;
	},
	//新建一个连接线后需要做的,更新前置节点的后置节点，更新后置节点的前置节点，更新连接线的前置和后置节点
	updateLineData          : function (connector) {
		var $preEle = $("#" + connector.sourceId); //连接线的前置节点
		var $folEle = $("#" + connector.targetId);     //连接线的后置节点
		var isConnectQzJD = this.isQzjd($folEle);

		//把连接线加到source节点的folNodes里
		var $folNodes = $preEle.data("folNodes") || [];
		if(isConnectQzJD) {    //连接权重模型的节点  后置节点为节点  不是连接线
			$folNodes.push($folEle);
		} else {
			$folNodes.push($(connector.connector.canvas));
		}
		$preEle.data("folNodes", $folNodes);
		//把连接线source节点加到target节点的preNodes里
		var $preNodes = $folEle.data("preNodes") || [];
		if(isConnectQzJD) {
			$preNodes.push($preEle);
		} else {
			$preNodes.push($(connector.connector.canvas));
		}
		$folEle.data("preNodes", $preNodes);
		//给连接线添加前置和后置节点
		$(connector.connector.canvas).data("preNodes", $preEle);
		$(connector.connector.canvas).data("folNodes", $folEle);
	},
	centre					: function() {
		var arr_x = [];
		var arr_y = [];
		var chls = this.$canvas.find(".node");
		var scope = this;
		$.each(chls, function(i, node) {
				arr_x.push(scope.getNodePosition($(node)).left);
				arr_y.push(scope.getNodePosition($(node)).top);
		});
		/*chls = this.$canvas.find(".aLabel");    //连接线的label也要考虑,居中暂不考虑
		$.each(chls, function(i, node) {
			arr_x.push(scope.getNodePosition($(node)).left);
			arr_y.push(scope.getNodePosition($(node)).top);
		});*/
		arr_x.sort(function(a, b) {
				return a - b;
			});
		arr_y.sort(function(a, b) {
				return a - b;
			});
		var center_x = (arr_x[0] + arr_x[arr_x.length - 1]) / 2;
		var center_y = (arr_y[0] + arr_y[arr_y.length - 1]) / 2;
		var off_x = this.canvasWidth / 2 - center_x;
		var off_y = this.canvasHeight / 2 - center_y;
		if (off_x < 0){
			if(arr_x[0]+off_x<0){
				off_x = 1-arr_x[0];
			}
		}
		if(off_y <0){
			if(arr_y[0]+off_y<0){
				off_y = 1-arr_y[0];
			}
		}
		chls = this.$canvas.find(".node");
		$.each(chls, function(i, node) {
			var x = $(node).position().left * 1 + off_x * 1;
			var y = $(node).position().top * 1 + off_y*1;
			$(node).css( {
				left	: x,
				top		: y
			});
			// 存储位置信息
			var data = scope.getNodeData($(node), true);
			data.position = data.position || {};
			data.position.left = x+"px";
			data.position.top = y+"px";
			scope.setNodeData($(node), data);
			scope.jsPlumbInstance.repaint($(node));
		});
        delete chls;
	},
	//所有元素向左上角移动
	leftTop                 : function () {
		var arr_x = [];
		var arr_y = [];
		var chls = this.$canvas.find(".node");
		var scope = this;
		$.each(chls, function(i, node) {
			arr_x.push(scope.getNodePosition($(node)).left);
			arr_y.push(scope.getNodePosition($(node)).top);
		});

		chls = this.$canvas.find(".aLabel");    //连接线的label也要考虑
		$.each(chls, function(i, node) {
			arr_x.push(scope.getNodePosition($(node)).left);
			arr_y.push(scope.getNodePosition($(node)).top);
		});
		//找到所有元素最左边和最右边的位置
		//arr_x = arr_x.concat(point_x);
		//arr_y = arr_y.concat(point_y);
		arr_x.sort(function(a, b) {
			return a - b;
		});
		arr_y.sort(function(a, b) {
			return a - b;
		});
		//最上和最右的节点减掉30像素，全部元素向左向上移动这个距离
		var off_x = arr_x[0] - 30;
		var off_y = arr_y[0] - 30;
		if(off_x < 0) {    //这种情况说明原来就已经在最左边
			off_x = 0;
		}
		if(off_y < 0) {    //这种情况说明原来就已经在最上面
			off_y = 0;
		}

		chls = this.$canvas.find(".node");
		$.each(chls, function(i, node) {
			var x = $(node).position().left * 1 - off_x * 1;
			var y = $(node).position().top * 1 - off_y*1;
			$(node).css({
				left	: x,
				top		: y
			});
			// 存储位置信息
			var data = scope.getNodeData($(node), true);
			data.position = data.position || {};
			data.position.left = x+"px";
			data.position.top = y+"px";
			scope.setNodeData($(node), data);
			scope.jsPlumbInstance.repaint($(node));
		});
		delete chls;
	},
	/**
	 * 是否只读模式
	 */
	isViewMode				: function() {
		return this.options.status == Model.Status.VIEW;
	},
	/**
	 * 是否编辑模式
	 */
	isEditMode				: function() {
		return this.options.status == Model.Status.EDIT;
	},
    /**
     * 是否调整模式
     */
    isAdjustMode            : function() {
        return this.options.status == Model.Status.ADJUST;
    },
    /**
     * 是否调整删除模式
     */
    isAdjustAndDelMode      : function() {
        return this.options.status == Model.Status.ADJUSTANDDEL;
    },
	_beforeCreateNode		: function(options) {
		return true;
	},
	//获取所有被选中的DOM元素
    getSelDomEls:function(){
        return this.selectedEls||{} ;
    },
	removeAll				: function(els) {
		var disEls = this.getSelDomEls();
		if (els) {
			disEls = els
		}
        for(var nodeId in disEls){
	        var $node = disEls[nodeId];
	        if(!(disEls[nodeId] instanceof jQuery)) {
		        $node = $(disEls[nodeId]);
	        }
            //var $node = $(disEls[nodeId]);
	        if (this.isJsjd($node) || this.isQzjd($node)) {
		        // 权重节点、结束节点不能删除
		        return;
	        }
	        if(this.isLine($node)){
		        if(this.getMxType()== Model.ModeType.LRegressor){    //权重模型连接线不允许删除
			        return;
		        }
	        }
            this.setBlur($node);
            this.removeNode($node);
        }
	},
	getMxType :function(){
	    return this.options.data.mxType;
	},
	//根据节点获取对应的code
	getNodeCode               : function ($node) {
		var nodeData = this.getNodeData($node);
		return nodeData.code;
	},
	//如果是line，传进来是$(connector.canvas)
	removeNode				: function($node) {
		var scope = this;
		var nodeData = scope.getNodeData($node, true);      //先把节点数据取出来
		var nodeId = nodeData.code;
		// 遍历node前置元素，删除后置元素中的node
		var $preNodes = $node.data("preNodes") || [];
		$.each($preNodes, function() {
			var $thisNode = this;
			if(!($thisNode instanceof jQuery)) {
				$thisNode = $($thisNode);
			}
			var $folNodes = $thisNode.data("folNodes") || [];
			$folNodes = $.grep($folNodes, function($folNode, index) {
				if (scope.getNodeCode($folNode[0]) == scope.getNodeCode($node[0])) {
					return false;
				}
				return true;
			});
			$thisNode.data("folNodes", $folNodes);
			var $line = $thisNode.data("line");
			if ($line && scope.getNodeCode($line[0]) == scope.getNodeCode($node[0])) {
				$thisNode.removeData("line");
			}
		});
		var $folNodes = $node.data("folNodes") || [];
		$.each($folNodes, function() {
			var $thisNode = this;
			if(!($thisNode instanceof jQuery)) {
				$thisNode = $($thisNode);
			}
			var _$preNodes = $thisNode.data("preNodes") || [];
			_$preNodes = $.grep(_$preNodes, function(_$folNode, index) {
					if (scope.getNodeCode(_$folNode[0]) == scope.getNodeCode($node[0])) {
						return false;
					}
					return true;
				});
			$thisNode.data("preNodes", _$preNodes);
			var $line = $thisNode.data("line");
			if ($line && scope.getNodeCode($line[0]) == scope.getNodeCode($node[0])) {
				$thisNode.removeData("line");
			}
		});

		// 如果是节点还要删除从节点流出的线
		if (this.isNode($node)) {
			var $folNodes = $node.data("folNodes") || [];
			if ($folNodes.length > 0) {
				$.each($folNodes, function() {
						var $folNode = this;
						scope.removeNode($folNode);
					});
			}
			var $preNodes = $node.data("preNodes") || [];
			if ($preNodes.length > 0) {
				$.each($preNodes, function() {
					var $preNode = this;
					scope.removeNode($preNode);
				});
			}
			var $line = $node.data("line");
			if ($line) {
				scope.removeNode($line);
				$node.removeData("line");
			}
			this.jsPlumbInstance.remove($node);
		}
		if (this.isLine($node)) {
			try {
				this.jsPlumbInstance.detach($node.data("lineConn"), false, true, false);
			}
			catch (e) {
				//this.jsPlumbInstance.detach($($node.canvas).data("lineConn"), false, true, false);
			}
		}
		// 从节点集合中删除
		delete this.nodes[nodeId];
        delete this.getSelDomEls()[nodeId];
		// 删除节点
		$node.removeData().unbind().remove();
	},
	selectEl				: function(node, e) {
		if (!e.shiftKey) {
			this.unSelectAll(node);
		}
		var data = this.getNodeData(node, true);
		this.selectedEls = this.getSelDomEls();
        this.selectedEls[data.code] = node;
	},
	unSelectEl				: function(node) {
		this.setBlur(node);
	},
	unSelectAll				: function(exceptNode) {
		var data = this.getNodeData(exceptNode, true);
        var selectedEls = this.getSelDomEls();
        for(var nodeId in selectedEls){
            if(!exceptNode || data.code != nodeId){
                this.unSelectEl(selectedEls[nodeId]);
            }
		}
	},
	setFocus				: function(node, e) {
		try {
			this.selectEl(node, e);
			// 设置节点样式
			if(this.isLine(node)) {
				this.focusEl = node;
				var connector = node.data("lineConn");
				this.jsPlumbInstance.select(connector).setPaintStyle(Model.JsPlumbDefault.activePaintStyle);
			} else {
				this.focusEl = $(node);
				$(node).css("border-style", "dashed");
			}
			//this.focusEl.show();

		} catch (ex) {
			//alert("{setFocus:}"+ex.message)
		}
	},
	setBlur					: function(node) {
		if(this.isLine(node)) {     //line
			var connector = node.data("lineConn");
			connector.setPaintStyle(Model.JsPlumbDefault.connectorStyle);
			var nodeData = this.getNodeData(node, true);
			delete this.getSelDomEls()[nodeData.code];
		} else {        //node
			if (!node) {
				if (this.focusEl != null) {
					this.focusEl.css("border-style", "solid");
				}
			} else {
				node.css("border-style", "solid");
				var nodeData = this.getNodeData(node, true);
				delete this.getSelDomEls()[nodeData.code];
			}
		}

		this.focusEl = null;
	},
	setNodeData				: function($node, options) {
		var $el = $node;
		if (!($node instanceof jQuery)) {
			$el = $($node);
		}
		options = $.extend( {}, this.getNodeData($el), options);
		$el.data("data", options);
		delete options;
	},
	getNodeData				: function($node, readOnly) {
		var $el = $node;
		if (!($node instanceof jQuery)) {
			$el = $($node);
		}
		var data = $el.data("data") || {};
        if(readOnly){
            return data;
        }
        return mini.dataClone(data);
	},
	getNodes				: function() {
        var scope = this;
		var nodes = [];
        $.each(this._nodes, function(){
            var $node = scope.nodes[this];
            if($node){
                nodes.push($node);
            }
        });
		return nodes;
	},
	getFxsyNodes			: function() {
        var scope = this;
		var nodes = scope.getNodes();
		var fxsyNodes = [];
		for (var i = 0,l=nodes.length; i < l; i++) {
			var node = nodes[i];
			if (scope.isFxysjd(node)) {
				fxsyNodes.push(node);
			}
		}
		return fxsyNodes;
	},

	getNode : function(nodeId) {
		return this.nodes[nodeId];
	},
	//获取节点id
	getNodeId               : function ($node) {
		var nodeData = {};
		try {
			nodeData = this.getNodeData($node);
		}
		catch (e) {
			nodeData = this.getNodeData($($node.connector.canvas));
		}

		return nodeData.code;
	},
	isNode : function($node) {
		var data = this.getNodeData($node, true);
		return data.elementType != Model.ElementType.LJXJD;
	},
	isJsjd					: function($node) {
		var data = this.getNodeData($node, true);
		return data.elementType == Model.ElementType.JSJD;
	},
	isQzjd					: function($node) {
		var data = this.getNodeData($node, true);
		return data.elementType == Model.ElementType.QZJD;
	},
	isZbjd					: function($node) {
		var data = this.getNodeData($node, true);
		return data.elementType == Model.ElementType.ZB;
	},
	isZbyjd					: function($node) {
		var data = this.getNodeData($node, true);
		return data.elementType == Model.ElementType.ZBY;
	},
	isMxjd					: function($node) {
		var data = this.getNodeData($node, true);
		return data.elementType == Model.ElementType.MX;
	},
	/**
	 * 是否为分析元素节点
	 * 
	 * @param {jquery对象}
	 *            $node 节点
	 * @return {Boolean}
	 */
	isFxysjd				: function($node) {
		if(this.isLine($node)) {
			return false;
		}
		return this.isZbjd($node) || this.isZbyjd($node) || this.isMxjd($node);
	},
    /**
     * 是否为过滤模型节点
     * @param {jquery对象} $line
     * @return {Boolean}
     */
    isGlmxjd                  : function($line) {
	    var data = this.getNodeData($line, true);
	    return data.lxbm == Model.LXBM.GLMXJD;

    },
	isLine					: function($line) {
		try {
			var data = this.getNodeData($line, true);
			return data.elementType == Model.ElementType.LJXJD;
		}
		catch(e){
			return true;
		}
	},
    /**
     * 获取节点位置
     * @param {jquery对象} $node
     * @return {} Position(left, top)
     */
    getNodePosition         : function($node){
        return {
            left: parseInt($node.css("left")),
            top : parseInt($node.css("top"))
        }
    },
    /**
     * 获取左侧最后一个分析元素节点位置
     */
    getLastLeftFxysJdTopPos     : function(){
        var nodes = this.getFxsyNodes();
        var topPos = 0;//距离顶部的位置
		var $nodeForGetHeight;
        for (var i = 0,l=nodes.length; i < l; i++) {
            var $node = nodes[i];
            var position = this.getNodePosition($node);
            if(position.left >= 0 && position.left <= 100){
				if(position.top>topPos){
					topPos=position.top;
					$nodeForGetHeight=$node;
				}
                topPos = Math.max(position.top, topPos);
            }
        }
        return topPos+parseInt($($nodeForGetHeight).height());
    },
	changeLineTypeAll: function () {
		
		if(this.getMxType() == Model.ModeType.LRegressor || this.isViewMode()) { //权重模型不允许修改连接线类型
			return;
		}
		
		var scope = ModelCanvasManager._getModelCanvas();//异步调用this为window对象,所以这里要重新取
		var connList = this.jsPlumbInstance.getConnections();
		var FlagOfHowChange=true;
		if(connList==""){
			return false;
		}
		
		mini.mask({
			el		: document.body,
			html	: "修改中，请稍候...",
			cls		: "mini-mask-loading"
		});

		function chunk(array,process) {
			var i=0,len = array.length;    //这里要注意在执行过程中数组最好是不变的
			setTimeout(function(){
				process(array[i]);    //循环体要做的操作
				i++;
				if(i < len){	
					setTimeout(arguments.callee,100)  //arguments.callee 的作用 就是 返回正被执行的 Function 对象
				} else{
					mini.unmask(document.body);
				}
			});
		}
		var isIE = (navigator.userAgent.indexOf('MSIE') >= 0) && (navigator.userAgent.indexOf('Opera') < 0);
		
		$.each(connList,function(index){
			if(connList[index].getConnector().type!="Flowchart"){
				FlagOfHowChange=false;
			}
		});
		if(FlagOfHowChange){
			Model.currentLineType = "Flowchart";
		}
		//修改当前线型
		if(Model.currentLineType == "Straight"){
			Model.currentLineType = "Flowchart";
		}else{
			Model.currentLineType = "Straight";
		}
		$.each(connList,function(index,dom){	
			if(Model.currentLineType == $(connList[index].connector.canvas).data("lineConn").getConnector().type){//已经是当前线型，不用切换
				connList[index]="noNeed";
			}
		});

		if(isIE) {
			chunk(connList, scope.changeLineType);
		} else {
			$.each(connList,function(){
				scope.changeLineType(this);
			});
			mini.unmask(document.body);
		}
	},
	/*改变单个端点的文本显示模式，文本是否换行显示
		@Param $nodeofDom: 端点的DOM或者是连线对象
		@Param type:节点的类型 Model.type
		@Param IfCheck: 是否进行覆盖重新布局位置处理,如果不需要则设置为true
	*/
	changeSingelShowCellType:function($nodeofDom,type,IfCheck){
		
		var valueOfWordWrap,Nodetype,$nodesForModefy;
		var $node = $nodeofDom;
		var type=type;
		var IfCheck = IfCheck;
		var _this=this;
		var data = _this.getNodeData($node);		
		
		//如果传入的是 connector 对象,则真正保存数据的是在$node.connector.canvas中
		if(!data.code&&type==Model.type.Line){
			$node=$node.connector.canvas
			data = _this.getNodeData($node);

		}
		
		valueOfWordWrap=data.wordWrapType=data.wordWrapType?0:1;
		Nodetype = Model.getNodeType(data.lxbm, data.elementType);
		_this.setNodeData($node,data);
		
		if(Nodetype == "ZBJD"||Nodetype == "ZMXJD") {
			$nodesForModefy=_this.nodes[data.code].find(".node_label");
		}
		if(Nodetype == "LJXJD") {
			var Dom = _this.nodes[data.code].data("lineConn")
			$nodesForModefy=Dom.getOverlay("label");
			if($nodesForModefy){
				mini.mask({
					el		: document.body,
					html	: "修改中，请稍候...",
					cls		: "mini-mask-loading"
				});
				setTimeout(function(){
					mini.unmask(document.body);	
					//删除原来连接线信息
					var canvas = ModelCanvasManager._getModelCanvas();      //异步调用this为window对象,所以这里要重新取
					
					var data = canvas.getNodeData($(Dom.connector.canvas));
					var overlay = Dom.getOverlay("label");
					
					if(overlay) {
						
						canvas.deleteLineInfo(Dom);
						
						var label = overlay.getLabel();
						var title = overlay.title;
						var conditon = data.conditon || {};
						var label = conditon.zwms || "";
						var cls = overlay.canvas.className;
						title=title==undefined?label:title;
					}else{
						return false;
					}
					
					if (Dom.getConnector().type == "Straight") {
						Dom.removeType("Straight");
						Dom.addType("Straight");
					} else {
						Dom.removeType("Flowchart");
						Dom.addType("Flowchart");
					}
					if(overlay) {
						Dom.addOverlay(Model.JsPlumbDefault.connectionOverlaysLabel);
						overlay = Dom.getOverlay("label");
						overlay.addClass(cls);
						overlay.setLabel(label, title + "");
					}
					canvas.setNodeData($(Dom.connector.canvas), data);       //更新连接线数据
					canvas.nodes[data.code] = $(Dom.connector.canvas);       //更新连接线数据
					$(Dom.connector.canvas).data("lineConn", Dom);  //要更新connector信息
					canvas.updateLineData(Dom);
					//重绘完判断一下覆盖
					if(!IfCheck){
						_this.ReDrawForCover();
					}
				},50);
			}
		}
		
		if($nodesForModefy){
			if(valueOfWordWrap){
				$nodesForModefy.addClass(Model.Elements[Nodetype].nodeClassWrapShow);
			}else{
				$nodesForModefy.removeClass(Model.Elements[Nodetype].nodeClassWrapShow);
				if(!IfCheck){
					IfCheck=true
				}
			}
			//重绘完判断一下覆盖
			if(Nodetype == "ZBJD"||Nodetype == "ZMXJD") {
				_this.jsPlumbInstance.repaint($node);
				if(!IfCheck){
					_this.ReDrawForCover();
				}
			}
		}
	},
	/*改变端点显示文本的形式 形式一：全称自动换行（宽度不变，高度增加）；形式二：缩略显示（高度宽度都不变，就是现在的情况）
	*/
	changeShowCellType:function(){
			
		//默认第一次执行为换行操作 
		var _this=this;
		var nodes = this.getNodes();
		var NeedModefyNode=[]; //真正需要处理的节点
		
		//筛选有效的节点
		$.each(nodes,function(index,$dom){
			var data = _this.getNodeData($dom);
			var type = Model.getNodeType(data.lxbm, data.elementType);
			if(type == "LJXJD") {
				if(_this.$qzjdNode){ //如果是权重页面就不计算连线里面的标签了
					return true; 
				}
				var Dom = $dom.data("lineConn")
				if(Dom.getOverlay("label")){
					NeedModefyNode.push($dom);
				}
			}else if(type=='JSJD'||type=='QZJD'){
				return true; 
			}else{
				NeedModefyNode.push($dom);
			}
		})

		var FlagOfALLWrap =true;
		var FlagOfALLNoWrap =true;
		$.each(NeedModefyNode,function(index,$dom){ //通过循环，遍历当前全局是否为换行显示设置
			var data = _this.getNodeData($dom);
			if(data.wordWrapType==0){ //
				FlagOfALLWrap=false;
			}
			if(data.wordWrapType==1){ //
				FlagOfALLNoWrap=false;
			}
		})
		if(FlagOfALLWrap){//所有都为1
			_this.currentIfShowWrap=true;
		}
		if(FlagOfALLNoWrap){//所有都为0
			_this.currentIfShowWrap=false;
		}
		if(_this.currentIfShowWrap){
			_this.currentIfShowWrap=false;
		}else{
			_this.currentIfShowWrap=true;
		}
		
		//changeSingelShowCellType:function($nodeofDom,type,IfCheck){
		$.each(NeedModefyNode,function(index,$dom){
			var data = _this.getNodeData($dom);
			if(data.wordWrapType==_this.currentIfShowWrap){
				return true;
			}else{
				data.wordWrapType=_this.currentIfShowWrap?0:1;
			}
			_this.setNodeData($dom,data);
			if(index==NeedModefyNode.length-1){
				_this.changeSingelShowCellType($dom);
			}else{
				_this.changeSingelShowCellType($dom,null,true);
			}
		})
		return false;
	},
	/*当点击切换线型和文本换行按钮时，由于高度重置，会造成覆盖的修复
	*/
	ReDrawForCover:function(){
		/*
		if(this.currentIfShowWrap==0){//不折行，不做处理
			return false;
		}
		*/
		mini.mask({
			el		: document.body,
			html	: "修改中，请稍候...",
			cls		: "mini-mask-loading"
		});

		var FlagIfToCheckCover=true; 	//是否需要检查
		var nodes = this.getNodes();	//获取所有需要检查节点
		var ArrayOfCheckDom=[];			//需要检查的节点
		var _this=this;

		$.each(nodes,function(index,$dom){
			var data = _this.getNodeData($dom);
			var type = Model.getNodeType(data.lxbm, data.elementType);
			var $nodes;
			if(type == "LJXJD") {
				if(_this.$qzjdNode){ //如果是权重页面就不计算连线里面的标签了
					return true; 
				}
				var Dom = _this.nodes[data.code].data("lineConn");
				if(!Dom.getOverlay("label")){
					return true;
				}
				$nodes = $(Dom.getOverlay("label").getElement());
			}else{
				$nodes=_this.nodes[data.code];
			}
			var PushObj={
				$DomOfShow:$nodes,	//负责显示的DOM
				$DomOfData:$dom,	//保存数据的DOM
				Domtype:type
			}
			ArrayOfCheckDom.push(PushObj);
		})

		var MaxNum=ArrayOfCheckDom.length*ArrayOfCheckDom.length; //最大的检查次数-防止死循环
		var FlagOfOut=0;	//退出循环的计数器
		while(FlagIfToCheckCover){

			var IfOver=true; //当前两个比对的节点是否需要重新布局
			//数据加工
			$.each(ArrayOfCheckDom,function(index,obj){
				var Position = obj.$DomOfShow.position();
				var width = obj.$DomOfShow.outerWidth();
				var height= obj.$DomOfShow.outerHeight();
				obj.X=Position.left;
				obj.Y=Position.top;
				obj.botX=width+Position.left;
				obj.botY=height+Position.top;
				obj.HalfWidth=width/2;
				obj.HalfHeight=height/2;
				obj.centerX=obj.X+obj.HalfWidth;
				obj.centerY=obj.Y+obj.HalfHeight;
			})
			
			jumpout://用于跳出循环
			for(var i=ArrayOfCheckDom.length-1;i>=0;i--){
				//当前节点
				var $CurrentObj = ArrayOfCheckDom[i];
				
				for(var j=ArrayOfCheckDom.length-1;j>=0;j--){
					//需要比对节点
					var $OtherObj=ArrayOfCheckDom[j];
					
					if($CurrentObj==$OtherObj){
						continue;
					}

					var DistanceX = Math.abs($CurrentObj.centerX-$OtherObj.centerX);
					var DistanceY = Math.abs($CurrentObj.centerY-$OtherObj.centerY);
					var TotalWidth = $CurrentObj.HalfWidth+$OtherObj.HalfWidth;
					var TotalHeight= $CurrentObj.HalfHeight+$OtherObj.HalfHeight;
					var MinWidth=$CurrentObj.HalfWidth>$OtherObj.HalfWidth?$OtherObj.HalfWidth:$CurrentObj.HalfWidth;
					var MinHeight=$CurrentObj.HalfHeight>$OtherObj.HalfHeight?$OtherObj.HalfHeight:$CurrentObj.HalfHeight
					var MaxWidth=$CurrentObj.HalfWidth>$OtherObj.HalfWidth?$CurrentObj.HalfWidth:$OtherObj.HalfWidth;
					var MaxHeight=$CurrentObj.HalfHeight>$OtherObj.HalfHeight?$CurrentObj.HalfHeight:$OtherObj.HalfHeight
					
					//这里判断是否需要移动位置
					if(DistanceX<=MaxWidth&&DistanceY<=MaxHeight){	
						
						IfOver=false;
						
						var $ChangePositionDom = ($CurrentObj.Y>$OtherObj.Y)?$CurrentObj:$OtherObj;
						var $HoldPositionDom =($ChangePositionDom==$CurrentObj)?$OtherObj:$CurrentObj;
						var $MoveDom = $ChangePositionDom.$DomOfData;
						var data = _this.getNodeData($MoveDom);
						/*
						if($ChangePositionDom.Domtype=="LJXJD"&&$HoldPositionDom.Domtype!="LJXJD"){ //如果是连接线，找下家 

							var folNodes = _this.nodes[data.code].data("folNodes")
							//注意：这里变成折线的时候有可能不是数组了
							if(Object.prototype.toString.call(folNodes) === '[object Array]'){
								$MoveDom = folNodes[0];
							}else{
								$MoveDom = folNodes;
							}
							data = _this.getNodeData($MoveDom);
						}
						*/
						if($ChangePositionDom.Domtype=="LJXJD"){
							
							var preNodes = _this.nodes[data.code].data("preNodes")
							//注意：这里变成折线的时候有可能不是数组了
							if(Object.prototype.toString.call(preNodes) === '[object Array]'){
								$MoveDom = preNodes[0];
							}else{
								$MoveDom = preNodes;
							}
							data = _this.getNodeData($MoveDom);
							
						}

						var moveY=parseInt(data.position.top)+TotalHeight/2;
						var moveX=parseInt(data.position.left)+TotalWidth/2;
						
						data.position = data.position || {};
						data.position.top = moveY+"px";
						//data.position.left = moveX+"px";
						_this.setNodeData($MoveDom, data);
						$MoveDom.css("top",moveY);
						//$MoveDom.css("left",moveX);
						_this.jsPlumbInstance.repaint($MoveDom);
						break jumpout;
					}
				}
			}
			FlagOfOut++;
			if(IfOver||FlagOfOut>MaxNum){
				FlagIfToCheckCover=false;
			}
		}//END while
		mini.unmask(document.body);
		return false;
	},
	changeLineTypeMore         : function(lines){
		 var selEls = this.getSelDomEls();
        if (lines) {
            selEls = selEls;
        }
        selEls=selEls||[];
		 var scope = this;
	     $.each(selEls,function(){
		     if(scope.isLine(this)) {
				if(Model.currentLineType == this.data("lineConn").getConnector().type){//已经是当前线型，不用切换
					return true;
				}
			    scope.changeLineType(this.data("lineConn"));
		     }
	     });
	},


	//ep 为connector对象
	changeLineType			: function(ep) {
		if(ep=="noNeed"){return true} //对不需要处理的线进行特殊处理，直接返回
		//删除原来连接线信息
		var canvas = ModelCanvasManager._getModelCanvas();      //异步调用this为window对象,所以这里要重新取
		canvas.deleteLineInfo(ep);
		var data = canvas.getNodeData($(ep.connector.canvas));
		var overlay = ep.getOverlay("label");
		if(overlay) {
			var label = overlay.getLabel();
			var title = overlay.canvas.title;
			var conditon = data.conditon || {};

			var label = conditon.zwms || "";
			title=title==undefined?label:title;
			var cls = overlay.canvas.className;
		}
		if (ep.getConnector().type == "Straight") {
			ep.removeType("Straight");
			ep.addType("Flowchart");
			//ep.setType("Flowchart");
			data.position.lineType = "Flowchart";
		} else {
			ep.removeType("Flowchart");
			ep.addType("Straight");
			//ep.setType("Straight");
			data.position.lineType = "Straight";
		}

		if(overlay) {
			ep.addOverlay(Model.JsPlumbDefault.connectionOverlaysLabel);
			overlay = ep.getOverlay("label");
			overlay.addClass(cls);
			overlay.setLabel(label, title + "");
		}
		canvas.setNodeData($(ep.connector.canvas), data);       //更新连接线数据
		canvas.nodes[data.code] = $(ep.connector.canvas);       //更新连接线数据
		$(ep.connector.canvas).data("lineConn", ep);  //要更新connector信息
		canvas.updateLineData(ep);
	},
	//删除连接线在前后置节点里的信息
	deleteLineInfo          : function (connector) {
		var $preEle = $("#" + connector.sourceId); //连接线的前置节点
		var $folEle = $("#" + connector.targetId);     //连接线的后置节点
		var scope = ModelCanvasManager._getModelCanvas();;
		var $folNodes = $preEle.data("folNodes") || [];
		var newFol = [];
		$.each($folNodes, function() {
			if(!scope.isLine(this)) {
				newFol.push(this);
			} else {
				if(this.data("lineConn") != connector) {
					newFol.push(this);
				}
			}
		});
		$preEle.data("folNodes", newFol);

		var $preNodes = $folEle.data("preNodes") || [];
		var newPre = [];
		$.each($preNodes, function() {
			if(!scope.isLine(this)) {
				newPre.push(this);
			} else {
				if(this.data("lineConn") != connector) {
					newPre.push(this);
				}
			}
		});
		$folEle.data("preNodes", newPre);
	},
    setLineType             : function($line, lineType){
        var data = this.getNodeData($line, true);
        data.position = data.position || {};
        if(!lineType){
            lineType = Model.getNewLineType(data.position.lineType);
        }
        data.position.lineType = lineType;
        this.setNodeData($line, data);
    },
	afterCreateZbjd : $.noop,
	_createZbjd				: function(options) {
		if(!options.data.lxbm) {
			options.data = $.extend({}, options.data, {"lxbm": "BASE.MX.MXJD.ZBDFJD"});
		}
		var $node = this._createElNode(options);
		if(!this.isViewMode()) {
			this._createConnectionNode($node, options);
		}
		if (!this.isViewMode()) {
			$node.bind("dblclick", function() {
					Zbdfsz.showWin($node);
				});
			/*$node.bind("contextmenu", function(e) {
				PopMenu.show(e, Model.type.Node, $node);
			});*/
		}
		this.afterCreateZbjd($node, options);
		return $node;
	},
	_createLjxjd			: function(options) {
		var lineType = "Straight";
		if(options.data.position.lineType == "PolyLine" || options.data.position.lineType == "Flowchart") {//兼容以前老的
			lineType = "Flowchart";
		} else {
			lineType = "Straight";
		}
		var conditon = options.data.conditon || {};
		var label = conditon.zwms || "";
		var connector = this._connect(options.data.preElements[0], options.data.folElements[0], lineType, label,options);
		this.updateLineData(connector);
		this.afterCreateLjxjd(connector, options);
		return connector;
	},
	afterCreateLjxjd : function(connector, options) {
		/*var scope = this;
		if (!this.isViewMode()) {
			$node.bind("mousedown", function(e) {
				scope.dragLine(e, $node);
			}).bind("click",function(){
				scope._adjustLine($node);
			});
		}*/
	},
	_createJsjd				: function(options) {
		options.data[Model.textField] = "";
		//options.name = "";
		var $node = this._createElNode(options);
		if(!this.isViewMode()) {
			this._createConnectionNode($node, options);
		}
		this.$jsjdNode = $node;// 结束节点
		this.afterCreateJsjd($node);
		return $node;
	},
	afterCreateJsjd			: $.noop,
	_createQzjd				: function(options) {
		options.name = "权重设置";
		var $node = this._createElNode(options);
		if(!this.isViewMode()) {
			this._createConnectionNode($node, options);
		}
		this.$qzjdNode = $node;// 权重设置节点

		this.afterCreateQzjd($node);
		return $node;
	},
	afterCreateQzjd			: $.noop,
	_createZmxjd			: function(options) {
		if(!options.data.lxbm) {
			options.data = $.extend({}, options.data, {"lxbm": "BASE.MX.MXJD.ZMXJD"});
		}
        options.width = parseInt(this.getNodeWidth(options)) + "px";
		var $node = this._createElNode(options);
		if(!this.isViewMode()) {
			this._createConnectionNode($node, options);
		}

        var nodeId = $node.attr("id");
        if(options.data.mx && options.data.mx.zmxbz == 'Y'){
	        options.data.elementCode = "MX"+nodeId;
            options.data.mx.code = "MX"+nodeId;
        }

        var scope = this;
        $node.bind("dblclick", function() {
            var data = scope.getNodeData($node);
            // 初始化模型语义图
            scope._getZmxData($node, data, function($node, data){
                scope._initZmxCanvas($node, data);
            });
        });
        this.afterCreateZmxjd($node, options);
        return $node;
	},
    _getZmxData             : function($node, options, callback){
        var scope = this;
        var data = options || this.getNodeData($node);
        if(data.mx){
            callback($node, data);
        }else{
	        $.ajax( {
	            url         : '/data.json?logic-name=getMdataTreeJsonHandler&type=st&queryJson={"queryLxbm":"BASE.MX","queryCodes":["'
	                    + data.elementCode + '"]}',
                showMask    : true,
	            success     : function(result) {
	                var sts = mini.decode(result);
	                if (sts.length > 0) {
	                    data.mx = sts[0];
                        if($node){
                            scope.setNodeData($node, data);
                        }
                        callback($node, data);
	                }
	            }
	        });
        }
    },
	afterCreateZmxjd		: function($node, nodeData) {
		/*var scope = this;
		if (!this.isViewMode()) {
			$node.bind("focus", function(e, node, event) {
					scope._showLine($node);
					scope.dragNode(event, $node);
				});
		}*/
	},
	/**
	 * 初始化模型语义图
	 */
	_initZmxCanvas			: function($node, data) {
		var status = Model.Status.EDIT;
		if (this.isViewMode() || data.mx.zmxbz != 'Y') {
			status = Model.Status.VIEW;
		}
		var canvasManager = new Model.ModelCanvasManager( {
					status			: status,
					data			: data.mx,
					parentNodeId	: $node.attr("id")
				});
		Model.canvasManagers.push(canvasManager);
	},
	//获取终止于$node节点的节点集合
	getPathsToNode			: function($node, path) {
		var scope = this;
		var paths = [];
		path = path || [$node];
		var $preNodes = $node.data("preNodes") || [];
		$.each($preNodes, function(i) {
			var $thisNode = this;
			var _path = path.concat();
			if (!scope.isLine($thisNode)) {
				_path.push($thisNode);
			}
			if(!($thisNode instanceof jQuery)) {
				$thisNode = $($thisNode);
			}
			var _$preNodes = $thisNode.data("preNodes") || [];
			if (_$preNodes.length > 0) {
				paths = paths.concat(scope.getPathsToNode($thisNode, _path));
			} else {
				paths.push(_path.reverse());
			}
		});
		return paths;
	},
	getPathsToNodeTextValue	: function($node) {
		var paths = this.getPathsToNode($node);
		var textValues = [];
		var scope = this;
		$.each(paths, function() {
				var text = "";
				var value = "";
				$.each(this, function(i) {
						if (i > 0) {
							text += "-->";
							value += ",";
						}
						//var overlay  = this.getOverlay();
						var data = scope.getNodeData(this, true);
						text += data.name || "结束";//只有结束节点name为""
						value += data.code;//this.attr("id");
					});
				textValues.push( {
					sxljmc	: text,
					sxlj	: value
				})
			});
		return textValues;
	},
	_checkLjx				: function($line, sourceId, targetId) {
		var $fromNode = $("#" + sourceId);//$line.data("preNodes")[0];
		if(!($fromNode instanceof jQuery)) {
			$fromNode = $($fromNode);
		}
		var $endNode = $("#" + targetId);
		if(!($endNode instanceof jQuery)) {
			$endNode = $($endNode);
		}
		if (this._existsLjx($fromNode, $endNode, $line)) {
			return "MODEL.LINE_CHECK_EXISTS";
		}
		if (this._existsCircle(sourceId, $endNode)) {
			return "MODEL.LINE_CHECK_CIRCLE";
		}
		return "MODEL.LINE_CHECK_PASS";
	},
	/**
	 * 检查2个节点间是否已经存在链接线
	 * 
	 * @param {}
	 *            $fromNode 开始节点
	 * @param {}
	 *            $endNode 结束节点
	 * @return {Boolean}
	 */
	_existsLjx				: function($fromNode, $endNode, $line) {
		var $folNodes = $fromNode.data("folNodes") || [];
		for (var i = 0, l=$folNodes.length; i < l; i++) {
			if (this.getNodeId($folNodes[i]) == this.getNodeId($line))
				continue;
			var eNodes = $folNodes[i].data("folNodes") || [];
			for (var j = 0,len=eNodes.length; j < len; j++) {
				if (this.getNodeId($endNode) == this.getNodeId(eNodes[j])) {
					return true;
				}
			}
		}
		return false;
	},
	/**
	 * 判断在$fromNode, $endNode之间建立连接线后是否会成型回路
	 * 
	 * @param {}
	 *            $fromNode 开始节点
	 * @param {}
	 *            $endNode 结束节点
	 * @return {}
	 */
	_existsCircle			: function(sourceId, $endNode) {
		return this._folNodeById(sourceId, $endNode);
	},
	/**
	 * 判断$node是否存在所给出id的后置节点
	 * 
	 * @param {}
	 *            id 目标ID
	 * @param {}
	 *            $node 父节点
	 * @return {Boolean}
	 */
	_folNodeById			: function(id, $node) {
		if(!($node instanceof jQuery)) {
			$node = $($node);
		}
		var $folNodes = $node.data("folNodes") || [];
		for (var i = 0; i < $folNodes.length; i++) {
			if (this.getNodeId($folNodes[i]) == id) {
				return true;
			}
			if(this._folNodeById(id, $folNodes[i])) {
				return true;
			}
		}
	},
	/**
	 * 获取节点宽度
	 * 
	 * @param {Object}
	 *            options
	 * @return {int}
	 */
	getNodeWidth			: function(options) {
		if (options.width) {
			return options.width;
		}

		// 根据文字长度获取节点宽度，最大为200
		var width = 200;
		if (options.name) {
			Model.$cual_span.html(options.name);
			width = Model.$cual_span[0].offsetWidth + 18;
			width = Math.min(width, 200);
		}
		return width;
	},
    /**
     * 保存前的校验
     * @param {} nodes 模型节点
     * @param {} doSaveFunction 回调方法
     * @param {} doSaveScope 回调方法的scope
     * @return {Boolean} 校验是否通过
     */
	validate				: function(nodes, doSaveFunction, doSaveScope) {
		var scope = this;
		var valid = true;
        // 结束节点不存在
        if (!this.$jsjdNode) {
            alert("MXGL.NO_JSJD_NODE");
            return false;
        }
		// 指标节点需要流入或流出至其他节点：非结束节点不存在后置节点
        $.each(nodes, function(){
	        if(scope.isLine(this)) {    //连接线不需要校验
		        return true;        //跳出本次循环
	        }
            var $node = this;
            // 指标节点需要流入或流出至其他节点
            var $folNodes = $node.data("folNodes") || [];
            if ($folNodes.length == 0 && !scope.isJsjd($node)) {
	            var nodeData = scope.getNodeData($node, true);
                alert({"MXGL.ZBNODE_NO_LINE":[nodeData.name]});
                valid = false;
                return false;
            }
        });
		if (!valid) {
			return false;
		}
		// 必须存在结束节点以外节点：节点集合的数量与初始节点数是否相同
		if (nodes.length == this.initNodesLen) {
			alert("MXGL.NO_NODES");
			return false;
		}

		return this.modelValidate(nodes, doSaveFunction, doSaveScope);
	},
	/**
     * 保存前的校验
     * @param {} nodes 模型节点
     * @param {} doSaveFunction 回调方法
     * @param {} doSaveScope 回调方法的scope
     * @return {Boolean} 校验是否通过
     */
	modelValidate			: function(nodes, doSaveFunction, doSaveScope) {
		return true;
	},
	/**
	 * 过滤数据中多余的属性
	 * 
	 * @param {}
	 *            data
	 */
	_filterData				: function(data) {
		delete data.skin;
		delete data.mc;
		delete data.ml;
		//delete data.startArrow;
		//delete data.endArrow;
		delete data.idField;
		delete data.textField;
		delete data.dashstyle;
		delete data.width;
		if(data.position.lineType) {
			if(data.position.lineType == "Flowchart" || data.position.lineType == "PolyLine") {
				data.position.lineType = "PolyLine";
			} else {
				data.position.lineType = "Line";
			}
		}

		return data;

	},
	/**
	 * 保存数据
	 * 
	 * @param skipValidate 跳过校验的开关
	 * @param doSaveFunction 回调方法
	 * @param scope 回调方法的scope
	 * @return {Array} mxjds
	 */
	save					: function(skipValidate, doSaveFunction, doSaveScope) {
		var scope = this;
        var nodes = this.getNodes();
		if (skipValidate || this.validate(nodes, doSaveFunction, doSaveScope)) {
			// 模型节点数据整理
			var mxjds = [];
            $.each(nodes, function(){
                var $node = this;
	            var data = scope.getNodeData($node, true); // 节点信息
                data = scope._filterData(data);
                //若为自定义模型，自定义模型名称为节点名称
                if(data.mx && data.mx.zmxbz === 'Y'){
                    data.mx.name = data.name;
                }else{//若为引用已有模型
                    delete data.mx;
                }
                // 前置节点
	            var $preNodes = $node.data("preNodes") || [];
                var preElements = [];
                $.each($preNodes, function() {
	                var connectorData = scope.getNodeData(this, true);
	                preElements.push(connectorData.code);
                });
                data.preElements = preElements;
                // 后置节点
	            var $folNodes = $node.data("folNodes") || [];
                var folElements = [];
                $.each($folNodes, function() {
	                var connectorData = scope.getNodeData(this, true);
	                folElements.push(connectorData.code);
                });
                data.folElements = folElements;
                mxjds.push(data);
            });
            doSaveFunction.call(doSaveScope, mxjds, this);
		}
	}
}

/**
 * 决策树模型
 * 
 * @param {}
 *            options
 */
Model.DTreeModelCanvas = function(options) {
	this.options = $.extend(this.options, options || {});
	this.$jsjdNode = null;// 结束节点
	Model.ModelCanvas.call(this, this.options);
}
$.extend(Model.DTreeModelCanvas.prototype, Model.ModelCanvas.prototype, {
	_create				: function() {
		// 新增 初始化：结束节点+预警节点
		if ('[%HTML::TEXT.show_yjjd%]') {
			// TODO 创建预警节点
		}
		// 创建结束节点
		this.__createJsjd();
	},
	__createJsjd		: function() {
		var $node = this.createNode({
			"lxbm"			: Model.LXBM.MXDFJD,
			"elementType"	: Model.ElementType.JSJD,
			"position"		: {
				"left"	: this.canvasWidth / 2 + "px",
				"top"	: (this.canvasHeight - 100) + "px"
			}
		});
		return $node;
	},
	afterCreateLjxjd	: function(connector, options) {
		var scope = this;
		if (!this.isViewMode()) {
			if(options.data.lxbm == Model.LXBM.GLMXJD){
				connector.bind("dblclick", function(e) {
					scope.bindLineDblClick(connector);
				});
			}
		}
	},
	afterCreateJsjd		: function($node) {
		if(!this.isViewMode()){
			$node.bind("dblclick", function() {
				Mxdfsz.showWin($node);
			});
			// 节点路径发生变化
			this.$canvas.bind("ljxChanged", Mxdfsz.onLjxChanged);
		}
	},
	/**
	 * 模型校验
	 * @param {} nodes 模型节点
	 * @param {} doSaveFunction 回调方法
	 * @param {} doSaveScope 回调方法的scope
	 * @return {Boolean} 校验是否通过
	 */
	modelValidate		: function(nodes, doSaveFunction, doSaveScope) {
		var scope = this;
		var valid = true;

		if (this.$jsjdNode) {
			//结束节点若公式为空，则默认为求和
			var data = scope.getNodeData(this.$jsjdNode, true);
			if(!data.dfgs){
				formula.setData(null);
				formula.isHidden = true;
				formula.addOperand("sum", "求和", "sum", Gsys.TYPE_YYCS);
				data.dfgs = formula.getData();
			}
			scope.setNodeData(this.$jsjdNode, data);
			// 节点是否中止于结束节点：路径中的节点数与节点集合的节点数是否相同
			var paths = this.getPathsToNode(this.$jsjdNode);
			var pathValues = [];// 全部路径上的节点
			$.each(paths, function() {
				$.each(this, function() {
					var connectorData = scope.getNodeData(this);
					var nodeId = connectorData.code;//this.attr("id");
					if ($.inArray(nodeId, pathValues) == -1) {
						pathValues.push(nodeId);
					}
				});
			});

			var _nodes = $.grep(nodes, function($node, index) {
				if (scope.isLine($node)) {
					return false;
				}
				return true;
			});
			if (pathValues.length < _nodes.length) {
				// 节点是否中止于结束节点
				alert("MXGL.NODE_NOT_ENDWITH_JSJD");
				return false;
			}
		}

		// 筛选条件未设置
		$.each(nodes, function(){
			var $node = this;
			if (scope.isGlmxjd($node)) {
				var data = scope.getNodeData($node, true);
				if (!data.conditon || data.conditon.zwms === "" ) {
					var $preNodes = $node.data("preNodes") || [];
					if($preNodes.length > 0){
						var nodeData = scope.getNodeData($preNodes[0], true);
						alert({"MXGL.DTREE_SXTJ_UNDEFINE": [nodeData.name]});
					}else{
						alert({"MXGL.DTREE_SXTJ_UNDEFINE": ["未知"]});
					}
					valid = false;
					return false;
				}
			}
		});

		return valid;
	}
});

/**
 * 权重树模型
 * 
 * @param {}
 *            options
 */
Model.LRegressorModelCanvas = function(options) {
	this.options = $.extend(this.options, options || {});

	this.$jsjdNode = null;// 结束节点
	this.$qzjdNode = null;// 权重设置节点

	Model.ModelCanvas.call(this, this.options);
}
$.extend(Model.LRegressorModelCanvas.prototype, Model.ModelCanvas.prototype, {
	initNodesLen		: 3,// 初始节点数
	_beforeCreateNode	: function(options) {
        var scope = this;
        var returnVal = true;
		// 指标或模型不能重复引用
		if (!options.mx || options.mx.zmxbz != 'Y'
				&& (options.elementType == Model.ElementType.ZB || options.elementType == Model.ElementType.ZBY || options.elementType == Model.ElementType.MX)) {
            $.each(this.getNodes(), function(){
                var $node = this;
                var data = scope.getNodeData($node, true);
                if (data.elementCode && data.elementCode == options.elementCode) {
                    alert( {
                        "MXGL.FXYS_EXSIT"   : [options.mc]
                    });
                    returnVal = false;
                    return false;
                }
            })
		}
		return returnVal;
	},
	_create				: function() {
		// 创建结束节点
		this.__createJsjd();
		// 创建权重设置节点
		this.__createQzjd();
		// 创建权重节点到结束节点的连接线节点
		this.__createLjxjdQz2Js();
	},
	afterCreateZbjd		: function($node, nodeData) {
		return this.__createLjx2Qzjd($node, nodeData);
	},
	afterCreateZmxjd	: function($node, nodeData) {
		/*var scope = this;
        if(!this.isViewMode()){
			$node.bind("focus", function(e, node, event) {
					scope.dragNode(event, $node);
				});
        }*/
		return this.__createLjx2Qzjd($node, nodeData);
	},
	__createLjx2Qzjd : function($zbnode, nodeData) {
		var nodeId = Model.uuid(15);
		if(nodeData.data.folElements && nodeData.data.folElements.length == 1){
			nodeId = nodeData.data.folElements[0];
		}
		var connector = this.createNode({
			"lxbm"			: Model.LXBM.BJJD,
			"code"          : nodeId,
			"elementType"	: Model.ElementType.LJXJD,
			"position"		: {
				"lineType"  : Model.LineType.PolyLine
			},
			"preElements"   : [$zbnode.attr("id")],
			"folElements"   : [this.$qzjdNode.attr("id")]
		});
		this.virtualNodes[nodeId] = $(connector.connector.canvas);
		delete this.nodes[nodeId];
		// 建立关联关系
		$(connector.connector.canvas).data("preNodes", [$zbnode]);
		$(connector.connector.canvas).data("folNodes", [this.$qzjdNode]);
		var preNodes = this.$qzjdNode.data("preNodes") || [];
		preNodes.push($(connector.connector.canvas));
		this.$qzjdNode.data("preNodes", preNodes);
		$zbnode.data("folNodes", [$(connector.connector.canvas)]);
		this.showLineInfo(connector, nodeData.data.qz);
		return connector;
	},
    afterCreateLjxjd :$.noop,
	/**
	 * 创建结束节点
	 * 
	 * @return {}
	 */
	__createJsjd		: function() {
		var $node = this.createNode( {
			"lxbm"			: Model.LXBM.BJJD,
			"elementType"	: Model.ElementType.JSJD,
			"position"		: {
				"left"	: (this.canvasWidth - 100) + "px",
				"top"	: this.canvasHeight / 2 + "px"
			}
		});
		return $node;
	},

	/**
	 * 创建权重节点
	 * 
	 * @return {}
	 */
	__createQzjd		: function() {
		var $node = this.createNode( {
			lxbm		: Model.LXBM.MXDFJD,
			elementType	: Model.ElementType.QZJD,
			position		: {
				left	: (this.canvasWidth - 400) + "px",
				top 	: (this.canvasHeight / 2 + 10) + "px"
			}
		});

		return $node;
	},
	afterCreateQzjd		: function($node) {
        if(!this.isViewMode()){
		    $node.bind("dblclick", function() {
				QzMxdfsz.showWin($node);
			});
        }
	},
	/**
	 * 创建权重节点到结束节点的连接线节点
	 */
	__createLjxjdQz2Js	: function() {
		var connector = this.createNode({
			"code"          : Model.uuid(15),
			"lxbm"			: Model.LXBM.GLMXJD,
			"elementType"	: Model.ElementType.LJXJD,
			"position"		: {
				"lineType":Model.LineType.Line
			},
			"preElements"   : [this.$qzjdNode.attr("id")],
			"folElements"   : [this.$jsjdNode.attr("id")]
		});
		// 建立关联关系
		$(connector.connector.canvas).data("preNodes", [this.$qzjdNode]);
		$(connector.connector.canvas).data("folNodes", [this.$jsjdNode]);
		this.$qzjdNode.data("folNodes", [$(connector.connector.canvas)]);
		this.$jsjdNode.data("preNodes", [$(connector.connector.canvas)]);
		return connector;
	},
	/**
	 * 模型校验
	 * @param {} nodes 模型节点
	 * @param {} doSaveFunction 回调方法
	 * @param {} doSaveScope 回调方法的scope
	 * @return {} 校验是否通过
	 */
	modelValidate		: function(nodes, doSaveFunction, doSaveScope) {
        var scope = this;
        var valid = true;
        $.each(nodes, function(){
            var $node = this;
            // 权重未定义
            if (scope.isFxysjd($node)) {
                var data = scope.getNodeData($node, true);
                if (data.qz == "" || data.qz == undefined) {
                    alert("MXGL.FXYS_QZ_UNDEFINED");
                    valid = false;
                    return false;
                }

                // 子模型校验
                if (valid && scope.isMxjd($node) && (data.mx && data.mx.zmxbz == 'Y')) {
                    if (!data.mx.mxjds || data.mx.mxjds.length == 0) {
                        alert("MXGL.ZMX_DEFINE_IMPERFECT");
                        valid = false;
                        return false;
                    }
                }
            }
         
        });
        //判断公式中是否存在节点不存在的指标或指标元或模型
        if(this.$qzjdNode){
            var data = this.getNodeData(this.$qzjdNode, true);
            var zbnames = QzMxdfsz.hasZbInFormula(data.dfgs,this.getFxsyNodes());
            if(zbnames!=""){
            	//发现有节点不存在，提示用户是否使用自动生成的公式
            	valid = false;
	        	confirm({"MXGL.QZMXDFGS_NO_JD":[zbnames]}, function(action) {
					if (action == "ok") {
						QzMxdfsz.initFxys();
	        			data.dfgs = QzMxdfsz.createDefaultDfgs();
						QzMxdfsz.saveZbqzData();
						scope.save(true, doSaveFunction, doSaveScope);
					}
				});
            }
		}
        return valid;
	}
});

/**
 * 混合模型
 * 
 * @param {}
 *            options
 */
Model.ComplexModelCanvas = function(options) {
	this.options = $.extend(this.options, options || {});
	Model.ModelCanvas.call(this, this.options);
}
$.extend(Model.ComplexModelCanvas.prototype, Model.DTreeModelCanvas.prototype, {
	/**
	 * 模型校验
	 * @param {} nodes 模型节点
	 * @param {} doSaveFunction 回调方法
	 * @param {} doSaveScope 回调方法的scope
	 * @return {} 校验是否通过
	 */
	modelValidate	: function(nodes, doSaveFunction, doSaveScope) {
        var scope = this;
		var valid = Model.DTreeModelCanvas.prototype.modelValidate.call(this, nodes);
		if (valid) {
            $.each(nodes, function(){
                var $node = this;
                var data = scope.getNodeData($node, true);

                // 子模型校验
                if (scope.isMxjd($node) && (data.mx && data.mx.zmxbz == 'Y')) {
                    if (!data.mx.mxjds || data.mx.mxjds.length == 0) {
                        alert("MXGL.ZMX_DEFINE_IMPERFECT");
                        valid = false;
                        return false;
                    }
                }
            })
		}
		return valid;
	}
});

Model.ModelCanvasManager = function(options) {
	this.options = {
        /**
         * 模式：edit为编辑模式，view为查看模式，adjust为调整模式（不允许删除）,adjustAndDel为调整删除模式
         */
		status			: 'edit',
        openTabId       : null,//主窗口TabID
		parentNodeId	: null,// 父节点ID
		data			: {},
        allowClose      : true,//是否允许关闭window
        afterSave       : false,//保存回调函数
        afterClose      : false//关闭回调函数
	};
	this.options = $.extend(this.options, options || {});
	this.init();
}

Model.ModelCanvasManager.prototype = {
	modelCanvas				: null,
	init					: function() {
		var data = this.options.data;

		switch (parseInt(data.mxType)) {
			case Model.ModeType.DTree :
				this.modelCanvas = new Model.DTreeModelCanvas(this.options);
				break;
			case Model.ModeType.LRegressor :
				this.modelCanvas = new Model.LRegressorModelCanvas(this.options);
				break;
			case Model.ModeType.Complex :
				this.modelCanvas = new Model.ComplexModelCanvas(this.options);
				break;
		}
	},
    destroy                 : function(){
        this.modelCanvas.destroy();
        delete this.modelCanvas;
        delete this.options;
        Model.destroy();
    },
	/**
	 * 获取当前模型的类型（如果当前画布为子模型就是子模型类型）
	 * @return {}
	 */
	getMxType				: function() {
		return this._getModelCanvas().getMxType();
	},
	getMxSelEls              : function() {
        return this._getModelCanvas().getSelDomEls();
    },
	_getModelCanvas			: function() {
		var canvasManger = Model.getCurrentCanvasManager();
		if (canvasManger) {
			return canvasManger.modelCanvas;
		} else {
			return this.modelCanvas;
		}
	},
    isViewMode : function(){
        var modelCanvas = this._getModelCanvas();
        return modelCanvas.isViewMode();
    },
    isAdjustMode : function(){
        var modelCanvas = this._getModelCanvas();
        return modelCanvas.isAdjustMode();
    },
	isAdjustAndDelMode : function(){
        var modelCanvas = this._getModelCanvas();
        return modelCanvas.isAdjustAndDelMode();
    },
    isAllowClose : function(){
        return this.options.allowClose == false;  
    },
    /**
     * 是否第一个画布
     * @return {Boolean}
     */
    isFirstCanvas : function(){
        var modelCanvas = this._getModelCanvas();
        return modelCanvas == this.modelCanvas;
    },
	save : function() {  
		var modelCanvas = this._getModelCanvas();
		modelCanvas.save(false, this.doSave, this);
	},
	doSave : function(data, modelCanvas) {
		if (!data) {// 校验不通过
			return;
		}
		if (modelCanvas == this.modelCanvas) {
            var success = true;
            if(this.options.openTabId && this.options.openTabId != "undefined"&& this.options.openTabId != "-1"){//-1表示没有父页面
                try {
	                success = parent.opener.PageContainer.setActiveTab(this.options.openTabId);
	                if(!success){
	                    alert({"MXGL.MODEL_EDIT_WIN_UNFIND":["保存"]});
	                    return;
	                }
	            } catch (e) {//主页面已关闭
	                success = false;
	                alert({"MXGL.MODEL_EDIT_WIN_UNFIND":["保存"]});
	            }
            }
            
            if(success){
	            if(this.options.openTabId != "-1"){
		            alert("COMMON.SAVE_SUCCESS");
	            }
                if(this.options.afterSave){
                    this.options.data.mxjds = mini.encode(data);
                    this.options.afterSave(this.options.data, true);
                    delete data;
                }
	            this.close();
            }
		} else {
            alert("COMMON.SAVE_SUCCESS");
			var parentNodeId = modelCanvas.options.parentNodeId;
			this.close();
			var _modelCanvas = this._getModelCanvas();
			var $parentNode = _modelCanvas.getNode(parentNodeId);
			var nodeData = _modelCanvas.getNodeData($parentNode, true);
			nodeData.mx = nodeData.mx || {};
			nodeData.mx.mxjds = data;
			_modelCanvas.setNodeData($parentNode, nodeData);
		}
	},
	close					: function() {
		var modelCanvas = this._getModelCanvas();
		if (modelCanvas == this.modelCanvas) {
            if(this.options.afterClose){
                this.options.afterClose();
            }
			parent.close();
		} else {
			modelCanvas.close();
		}
	},
	createNode : function(options) {
        var modelCanvas = this._getModelCanvas();
		if(!options.position){
			var topPos = modelCanvas.getLastLeftFxysJdTopPos();
			var left =50  ;
			var top = 50 + topPos;
		    options  =$.extend({},options,{"position":{"left": left+"px", "top":top+"px"}});
		}
		
        if(modelCanvas.isViewMode()){
            alert("MXGL.VIEW_MODE_UNADD");
            return;
        }
		modelCanvas.createNode(options);
	},
	centre					: function() {
		var modelCanvas = this._getModelCanvas();
		modelCanvas.centre();
	},
	removeAll				: function() {
		var modelCanvas = this._getModelCanvas();
        if(modelCanvas.isViewMode()){
            alert("MXGL.VIEW_MODE_UNDEL");
            return;
        }
		modelCanvas.removeAll();
	},
	setNodeData				: function($node, options, isCover) {
		var modelCanvas = this._getModelCanvas();
        var data = modelCanvas.getNodeData($node, true);
        if(!isCover){
            options = $.extend({}, data, options);
        }
		modelCanvas.setNodeData($node, options);
		// this.setLineSxtj($node, options);
	},
	setLineSxtj				: function($node, options) {
		options.conditon = options.conditon || {};
        var modelCanvas = this._getModelCanvas();
        modelCanvas.showLineInfo($node, options.conditon.zwms)
	},
	setLineQz				: function($node, options) {
        var modelCanvas = this._getModelCanvas();
		var folNodes = $node.data("folNodes") || [];
		var folData = modelCanvas.getNodeData($node, true);
		if (folNodes.length == 1) {
			var $line = folNodes[0];
            modelCanvas.showLineInfo($line, options.qz);
		}
	},
	getNodeData				: function($node, readOnly) {
		var modelCanvas = this._getModelCanvas();
		return modelCanvas.getNodeData($node, readOnly);
	},
	getPathsToNodeTextValue	: function($node) {
		var modelCanvas = this._getModelCanvas();
		return modelCanvas.getPathsToNodeTextValue($node);
	},
	getNodes				: function() {
		var modelCanvas = this._getModelCanvas();
		return modelCanvas.getNodes();
	},
	getFxsyNodes			: function() {
		var modelCanvas = this._getModelCanvas();
		var nodes = modelCanvas.getFxsyNodes();
		return nodes;
	},
	getCanvasSize           : function () {
		var modelCanvas = this._getModelCanvas();
		return [modelCanvas.canvasHeight, modelCanvas.canvasWidth];
	},
	changeLineTypeAll      : function() {
		var modelCanvas = this._getModelCanvas();
		modelCanvas.changeLineTypeAll();
	},
	leftTop					: function() {
		var modelCanvas = this._getModelCanvas();
		modelCanvas.leftTop();
	},
	/*改变端点显示文本的形式 形式一：全称自动换行（宽度不变，高度增加）；形式二：缩略显示（高度宽度都不变，就是现在的情况）
	*/
	changeShowCellType:function(){
		var modelCanvas = this._getModelCanvas();
		modelCanvas.changeShowCellType();
	},
	/*改变单个端点的文本显示模式，文本是否换行显示
		@Param $node: 端点的DOM或者是连线对象
		@Param type:节点的类型 Model.type
	*/
	changeSingelShowCellType:function($node,type){
		var modelCanvas = this._getModelCanvas();
		modelCanvas.changeSingelShowCellType($node,type);
	}
}