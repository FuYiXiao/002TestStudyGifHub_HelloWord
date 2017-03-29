$(function () {
	function ResizeDom(){
		///Ϊ���϶������ұ������ҵ�ʱ���ܳ��ֹ�����
		var width = $("#modelDefDiv").parent().width();
		var height = $("#modelDefDiv").parent().height();
		$("#modelDefDiv").width(width - 5);
		$("#modelDefDiv").height(height - 5);
	}��
	$(window).resize(function(){
		ResizeDom();
	});
	ResizeDom();
});

Model = {
	ModeType				: {
		DTree		: 0,// ������
		LRegressor	: 1,// Ȩ��ģ��
		Complex		: 2
		// ���ģ��
	},
	ElementType				: {
		ZB		: 0,// ָ��
		ZBY		: 1,// ָ��Ԫ
		MX		: 2,// ģ��
		YJFJ	: 3,// Ԥ���ּ��ڵ�
		LJXJD	: 7,// �����߽ڵ� ����
		QZJD	: 8,// Ȩ�ؽڵ�
		JSJD	: 9// �����ڵ�
	},
	type			: {
		Node	: "Node",// �ڵ�
		Line	: "Line",// ��
		Canvas  : "Canvas"  //����
	},
	LXBM					: {
		ZBDFJD	: "BASE.MX.MXJD.ZBDFJD", //ָ��÷ֽ��
		MXDFJD	: "BASE.MX.MXJD.MXDFJD", //ģ�͵÷ֽ��
		ZMXJD	: "BASE.MX.MXJD.ZMXJD",  //��ģ�ͽ��
		GLMXJD	: "BASE.MX.MXJD.GLMXJD", //����ģ�ͽ��
		BJJD	: "BASE.MX.MXJD.BJJD"	//��ǽ��
	},
	GSLX					: {
		SZ	: 0,// ��ֵ
		ZF	: 1,// �ַ�
		LJ	: 2,// �߼�
		RQ	: 3// ����
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
	JsPlumbDefault	        : {// ��ʽ����
		// point��ʽ
		paintStyle				: {
			strokeStyle	: "transparent",
			fillStyle	: "transparent",
			radius		: 2,
			lineWidth	: 1
		},
		// point��ʽ-hover
		hoverPaintStyle			: {
			strokeStyle	: "green",
			fillStyle	: "green",
			radius		: 5,
			lineWidth	: 2
		},
		//ѡ����ʽ
		activePaintStyle			: {
			strokeStyle	: "#228B22",
			fillStyle	: "#228B22",
			radius		: 5,
			lineWidth	: 2
		},
		// ��������ʽ
		connectorStyle			: {
			lineWidth	: 2,
			strokeStyle	: "#3693EF"
		},
		// ��������긡����ʽ
		connectorHoverStyle		: {
			lineWidth	: 2,
			strokeStyle	: "#D60C0C"
		},
		// �߽�������
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
	currentLineType : "Flowchart",//��ǰ����
	/**
	 * ��ȡ��ǰ����
	 */
	getCurrentCanvasManager	: function() {
		var len = Model.canvasManagers.length;
		if (len > 0) {
			return Model.canvasManagers[len - 1];
		}
		return null;
	},
	/**
	 * ��ȡnodeType����Model.NodeType�������
	 * 
	 * @param {String}
	 *            lxdm �ڵ�Ĳ������ͣ�������˫��Ч�����ࣩ
	 * @param {int}
	 *            elementType �ڵ��Ԫ�����ͣ���Model.ElementType����
	 * @return {String} nodeType
	 */
	getNodeType				: function(lxdm, elementType) {// ��Model.NodeType���
		var nodeType = "";
		if (elementType == Model.ElementType.ZB || elementType == Model.ElementType.ZBY) {// ָ���ֽڵ�
			nodeType = "ZBJD";
		} else if (elementType == Model.ElementType.MX) {// ��ģ�ͽڵ�
			nodeType = "ZMXJD";
		} else if (elementType == Model.ElementType.LJXJD) {// �����߽ڵ�
			nodeType = "LJXJD";
		} else if (lxdm == Model.LXBM.MXDFJD) {// ģ�ʹ�ֽڵ�
			if (elementType == Model.ElementType.QZJD) {
				nodeType = "QZJD";
			} else if (elementType == Model.ElementType.JSJD) {
				nodeType = "JSJD";
			}
		} else if (lxdm = Model.LXBM.BJJD) {// ��ǽڵ�
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
	 * ����sourceû�и�����ʽ
	 *
	 * @param {}
	 *            connector
	 */
	clearSourceHoverPaintStyle	: function(connector) {
		connector.endpoints[0].setHoverPaintStyle(Model.JsPlumbDefault.paintStyle);
	}
};
Model.Elements = {
	ZBJD: {      //ָ�� 0
		isSource		: true, // �Ƿ�����϶�����Ϊ������㣩
		isTarget		: true, // �Ƿ���Է��ã���Ϊ�����յ㣩
		iconCls         : "start",//ͼ����ʽ
		nodeClass       : "sl_box node",   //Ԫ����ʽ
		name			: "",
		nodeClassWrapShow   : "js-change-stype",   //Ԫ����ʽ
		data			: {}
	},
	ZMXJD: {   //ģ�� 2
		isSource			: true, // �Ƿ�����϶�����Ϊ������㣩
		isTarget			: true, // �Ƿ���Է��ã���Ϊ�����յ㣩
		iconCls         	: "start",//ͼ����ʽ
		nodeClass       	: "mx_box node",   //Ԫ����ʽ
		name				: "ģ��",
		nodeClassWrapShow   : "js-change-stype",   //Ԫ����ʽ
		data				: {}
	},
	LJXJD: {   //�����߽ڵ� 7
		iconCls         : "",//ͼ����ʽ
		name            : "",
		nodeClassWrapShow   : "js-change-stype",   //Ԫ����ʽ
		data			: {}
	},
	QZJD: {   //Ȩ�����ýڵ�  8
		isSource		: false, // �Ƿ�����϶�����Ϊ������㣩
		isTarget		: false, // �Ƿ���Է��ã���Ϊ�����յ㣩
		iconCls         : "",//ͼ����ʽ
		nodeClass       : "qz_box node",   //Ԫ����ʽ
		name            : "Ȩ������",
		nodeClassWrapShow   : "js-change-stype",   //Ԫ����ʽ
		data			: {}
	},
	JSJD			: {// �����ڵ�  9
		isSource		: false, // �Ƿ�����϶�����Ϊ������㣩
		isTarget		: true, // �Ƿ���Է��ã���Ϊ�����յ㣩
		iconCls         : "end",//ͼ����ʽ
		nodeClass       : "node",   //Ԫ����ʽ
		nodeClassWrapShow   : "js-change-stype",   //Ԫ����ʽ
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
    this._nodes = [];//�ڵ㼯�ϣ�������ɾ���Ľڵ㣬���ڱ���ڵ�����˳��
	this.virtualNodes = {}; //����ڵ�
    this.selectedEls = {};
	this.editable = (this.options.status == "edit");
	this.canvasWidth = this.$canvas.width();
	this.canvasHeight = this.$canvas.height();
	this.jsPlumbInstance = jsPlumb.getInstance();
	// Ĭ��ֵ��ʼ��
	this.jsPlumbInstance.importDefaults({
		DragOptions			: {
			cursor	: 'pointer',
			zIndex	: 2000
		}, // �϶�ʱ���ͣ���ڸ�Ԫ������ʾָ�룬ͨ��css����
		Anchor				: "Continuous",
		Endpoint			: ["Dot", {
			radius	: 2
		}],
		EndpointStyle		: Model.JsPlumbDefault.paintStyle,
		EndpointHoverStyle	: Model.JsPlumbDefault.hoverPaintStyle,
		HoverPaintStyle		: Model.JsPlumbDefault.connectorStyle,
		ConnectionOverlays	: Model.JsPlumbDefault.connectionOverlays
	});

	// ע��ֱ�ߺ�������������
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
		// ����ʾ���ӵ�
		this.jsPlumbInstance.importDefaults({
			Endpoint	: "Blank"
		});
	}
	this.init();
}
Model.ModelCanvas.prototype = {
	focusEl					: null,
	nodes					: {},// �ڵ㼯��,keyΪid
    _nodes                  : [],//�ڵ㼯�ϣ�������ɾ���Ľڵ㣬���ڱ���ڵ�����˳��
	virtualNodes            : {},//��mxjds�ڲ��Ľڵ㣬��Ȩ��ģ�͵�ָ��ڵ������
    selectedEls             : {},//ѡ��node�ڵ㣬keyΪid��valueΪnode
	initNodesLen			: 1,// ��ʼ�ڵ���
	toolbarHeight			: 26,
	editable                : false,    //��ǰģʽ�Ƿ�ɱ༭
	jsPlumbInstance         : {},   //��ǰjsPlumb����
	self                    : this,
	currentIfShowWrap		:false,  //��ǰ�Ƿ�����ʾ�ı�
	
	// �����������
	sourceOptions		: {
		filter				: ".node_source_icon",
		anchor				: "Continuous",
		reattach			: true,// �����������Ƿ�ԭ��ԭ������
		maxConnections		: -1,
		connector			: Model.JsPlumbDefault.connector,
		connectorStyle		: Model.JsPlumbDefault.connectorStyle,
		connectorHoverStyle	: Model.JsPlumbDefault.connectorHoverStyle
	},
	// �����յ�����
	targetOptions		: {
		isTarget	: true,
		anchor		: "Continuous",
		reattach	: true,// �����������Ƿ�ԭ��ԭ������
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
		// �޸� ����data.mxjds����
		var nodes = this.getNewNode(this.options.data.mxjds);
		//this.options.data.mxjds = nodes;
		//var nodes = this.options.data.mxjds;
		$.each(nodes, function() {
			scope.createNode(this)
		});
		// ����ǰ�ýڵ㡢���ýڵ㡢����������ʾ
		$.each(this.getNodes(), function() {
			var data = scope.getNodeData(this, true);
			data.preElements = data.preElements || [];
			data.folElements = data.folElements || [];
			// ǰ�ýڵ�
			var $preNodes = [];

			$.each(data.preElements, function() {
				var $node = scope.nodes[this] || scope.virtualNodes[this];
				$preNodes.push($node);
			});
			// ���ýڵ�
			var $folNodes = [];
			$.each(data.folElements, function() {
				var $node = scope.nodes[this] || scope.virtualNodes[this];
				$folNodes.push($node);
			});
			this.data("preNodes", $preNodes);
			this.data("folNodes", $folNodes);
		});
	},
	//�������߽ڵ�ŵ����
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
				//del�߶εĺ��ýڵ�
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
				//delԭtarget�ڵ��ǰ�ýڵ�
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
		this.jsPlumbInstance.bind("connection", function(info) {     //�������¼���Ȩ��ģ�Ͳ������
			var curMx = scope.getMxType();
			var connector = info.connection;
			if(curMx == Model.ModeType.LRegressor || connector.sourceId == connector.targetId) {    //Ȩ��ģ�Ͳ���Ҫ����
				return true;
			}
			var $preEle = $("#" + connector.sourceId); //�����ߵ�ǰ�ýڵ�
			var $folEle = $("#" + connector.targetId);     //�����ߵĺ��ýڵ�

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
					scope.removeNode($(connector.connector.canvas));  //У�鲻ͨ��  ɾ���ڵ�
				}, 10);
				alert(chk);
				return false;
			}
			//�����������Ҽ��˵��¼���Ȩ��ģ���²����Ŵ˹���
			if(curMx != Model.ModeType.LRegressor) {
				connector.bind("contextmenu", function(connection, originalEvent) {
					PopMenu.show(originalEvent, Model.type.Line, connector);
				});
			}
			//����������˫���¼�
			connector.bind("dblclick", function(connection, originalEvent) {
				if(!(curMx == Model.ModeType.Complex && !scope.isZbjd($preEle) && !scope.isZbyjd($preEle))) {        //���ӵ�Ȩ�ؽڵ�� ����˫���¼�
					scope.bindLineDblClick(connector);
				}
			});
			connector.bind("mousedown", function(connection, originalEvent) {
				scope.setFocus($(connector.connector.canvas), originalEvent);
			});
			return true;
		});
		this.$canvas.on("contextmenu", function(e) {    //�󶨻����Ҽ��˵��¼�
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
	//�����ڵ�Ԫ��
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
		
		// ��ʼ�����ڵ�û��sl_box��ʽ
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
		//Model.ModeType.LRegressor��Ȩ��ģ��
		if (options.isSource && IfShowSourcePoint && this.getMxType() != Model.ModeType.LRegressor) {
			$("<div class='node_source_icon " + options.iconCls + "_source'></div>").appendTo(el);
		}

		// label
		var label = $("<div id='" + elId + "_label' class='node_label " + classNameWrapShow +"' ></div>");
		label.appendTo(el);
		label.css(labelCss);
		this.setLabelNode(label, options.data[Model.textField] || options.name || "");
		// ��λ
		if (options.data.position) {
			el.css(options.data.position);
		}
		// �ڵ��϶�
		if (!this.isViewMode()) {
			if(options.data.elementType != Model.ElementType.JSJD &&
				options.data.elementType != Model.ElementType.QZJD) {     //���Ҽ��˵��¼�
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
	//�ô�����Ԫ�ؿ�������
	_createConnectionNode	: function(el, options) {
		if(this.getMxType() == Model.ModeType.LRegressor) { //Ȩ��ģ�Ͳ����ֶ�����
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
	//��������˫���¼�
	bindLineDblClick    : function (connector) {
		var data = this.getNodeData($("#"+connector.sourceId), true);
		var zbdm = data.elementCode;    // ��ȡ��������㴦��ָ�����
		var sjlx = data.sjlx;   // ��ȡ��������㴦��ָ����������
		// ��������ʾλ��
		var position = $(connector.connector.canvas).position();
		position.left = position.left + $(connector.connector.canvas).width();
		if (Model.GSLX.LJ == sjlx) {
			Sxtjsz.showBoolWin(Model.GSLX.LJ, position, zbdm, connector);
		} else {
			Sxtjsz.showFormula(Model.GSLX.LJ, zbdm, connector);
		}
	},
	setLabelNode			: function($node, label) {
		// ���ȴ���20��ʡ�Ժ���ʾ��һ�����ĳ���Ϊ2���˴����ý������滻Ϊxx�ļ��㷽ʽ
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
	//�޸������ϵ�����
	showLineInfo            : function (connector, szLabel) {
		if(!szLabel) {
			return;
		}
		try {
			var $label = connector.getOverlay("label");
			if(!$label) {   //�´�������������û��label��
				connector.addOverlay(Model.JsPlumbDefault.connectionOverlaysLabel);
				$label = connector.getOverlay("label");
			}
			$label.setLabel(szLabel + "");
			$label.canvas.title = szLabel;
		}
		catch(e) {
			var connectorEx = connector.data("lineConn");//this.oLines[nodeData.code];
			var $label = connectorEx.getOverlay("label");
			if(!$label) {   //�´�������������û��label��
				connectorEx.addOverlay(Model.JsPlumbDefault.connectionOverlaysLabel);
				$label = connectorEx.getOverlay("label");
			}
			$label.setLabel(szLabel + "");
			$label.canvas.title = szLabel;
		}
	},
	/**
	 * ���ӽڵ���ڵ�
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
		$(connector.connector.canvas).data("lineConn", connector);    //����connector����
		Model.clearSourceHoverPaintStyle(connector);
		return connector;
	},
	//�½�һ�������ߺ���Ҫ����,����ǰ�ýڵ�ĺ��ýڵ㣬���º��ýڵ��ǰ�ýڵ㣬���������ߵ�ǰ�úͺ��ýڵ�
	updateLineData          : function (connector) {
		var $preEle = $("#" + connector.sourceId); //�����ߵ�ǰ�ýڵ�
		var $folEle = $("#" + connector.targetId);     //�����ߵĺ��ýڵ�
		var isConnectQzJD = this.isQzjd($folEle);

		//�������߼ӵ�source�ڵ��folNodes��
		var $folNodes = $preEle.data("folNodes") || [];
		if(isConnectQzJD) {    //����Ȩ��ģ�͵Ľڵ�  ���ýڵ�Ϊ�ڵ�  ����������
			$folNodes.push($folEle);
		} else {
			$folNodes.push($(connector.connector.canvas));
		}
		$preEle.data("folNodes", $folNodes);
		//��������source�ڵ�ӵ�target�ڵ��preNodes��
		var $preNodes = $folEle.data("preNodes") || [];
		if(isConnectQzJD) {
			$preNodes.push($preEle);
		} else {
			$preNodes.push($(connector.connector.canvas));
		}
		$folEle.data("preNodes", $preNodes);
		//�����������ǰ�úͺ��ýڵ�
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
		/*chls = this.$canvas.find(".aLabel");    //�����ߵ�labelҲҪ����,�����ݲ�����
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
			// �洢λ����Ϣ
			var data = scope.getNodeData($(node), true);
			data.position = data.position || {};
			data.position.left = x+"px";
			data.position.top = y+"px";
			scope.setNodeData($(node), data);
			scope.jsPlumbInstance.repaint($(node));
		});
        delete chls;
	},
	//����Ԫ�������Ͻ��ƶ�
	leftTop                 : function () {
		var arr_x = [];
		var arr_y = [];
		var chls = this.$canvas.find(".node");
		var scope = this;
		$.each(chls, function(i, node) {
			arr_x.push(scope.getNodePosition($(node)).left);
			arr_y.push(scope.getNodePosition($(node)).top);
		});

		chls = this.$canvas.find(".aLabel");    //�����ߵ�labelҲҪ����
		$.each(chls, function(i, node) {
			arr_x.push(scope.getNodePosition($(node)).left);
			arr_y.push(scope.getNodePosition($(node)).top);
		});
		//�ҵ�����Ԫ������ߺ����ұߵ�λ��
		//arr_x = arr_x.concat(point_x);
		//arr_y = arr_y.concat(point_y);
		arr_x.sort(function(a, b) {
			return a - b;
		});
		arr_y.sort(function(a, b) {
			return a - b;
		});
		//���Ϻ����ҵĽڵ����30���أ�ȫ��Ԫ�����������ƶ��������
		var off_x = arr_x[0] - 30;
		var off_y = arr_y[0] - 30;
		if(off_x < 0) {    //�������˵��ԭ�����Ѿ��������
			off_x = 0;
		}
		if(off_y < 0) {    //�������˵��ԭ�����Ѿ���������
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
			// �洢λ����Ϣ
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
	 * �Ƿ�ֻ��ģʽ
	 */
	isViewMode				: function() {
		return this.options.status == Model.Status.VIEW;
	},
	/**
	 * �Ƿ�༭ģʽ
	 */
	isEditMode				: function() {
		return this.options.status == Model.Status.EDIT;
	},
    /**
     * �Ƿ����ģʽ
     */
    isAdjustMode            : function() {
        return this.options.status == Model.Status.ADJUST;
    },
    /**
     * �Ƿ����ɾ��ģʽ
     */
    isAdjustAndDelMode      : function() {
        return this.options.status == Model.Status.ADJUSTANDDEL;
    },
	_beforeCreateNode		: function(options) {
		return true;
	},
	//��ȡ���б�ѡ�е�DOMԪ��
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
		        // Ȩ�ؽڵ㡢�����ڵ㲻��ɾ��
		        return;
	        }
	        if(this.isLine($node)){
		        if(this.getMxType()== Model.ModeType.LRegressor){    //Ȩ��ģ�������߲�����ɾ��
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
	//���ݽڵ��ȡ��Ӧ��code
	getNodeCode               : function ($node) {
		var nodeData = this.getNodeData($node);
		return nodeData.code;
	},
	//�����line����������$(connector.canvas)
	removeNode				: function($node) {
		var scope = this;
		var nodeData = scope.getNodeData($node, true);      //�Ȱѽڵ�����ȡ����
		var nodeId = nodeData.code;
		// ����nodeǰ��Ԫ�أ�ɾ������Ԫ���е�node
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

		// ����ǽڵ㻹Ҫɾ���ӽڵ���������
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
		// �ӽڵ㼯����ɾ��
		delete this.nodes[nodeId];
        delete this.getSelDomEls()[nodeId];
		// ɾ���ڵ�
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
			// ���ýڵ���ʽ
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
	//��ȡ�ڵ�id
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
	 * �Ƿ�Ϊ����Ԫ�ؽڵ�
	 * 
	 * @param {jquery����}
	 *            $node �ڵ�
	 * @return {Boolean}
	 */
	isFxysjd				: function($node) {
		if(this.isLine($node)) {
			return false;
		}
		return this.isZbjd($node) || this.isZbyjd($node) || this.isMxjd($node);
	},
    /**
     * �Ƿ�Ϊ����ģ�ͽڵ�
     * @param {jquery����} $line
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
     * ��ȡ�ڵ�λ��
     * @param {jquery����} $node
     * @return {} Position(left, top)
     */
    getNodePosition         : function($node){
        return {
            left: parseInt($node.css("left")),
            top : parseInt($node.css("top"))
        }
    },
    /**
     * ��ȡ������һ������Ԫ�ؽڵ�λ��
     */
    getLastLeftFxysJdTopPos     : function(){
        var nodes = this.getFxsyNodes();
        var topPos = 0;//���붥����λ��
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
		
		if(this.getMxType() == Model.ModeType.LRegressor || this.isViewMode()) { //Ȩ��ģ�Ͳ������޸�����������
			return;
		}
		
		var scope = ModelCanvasManager._getModelCanvas();//�첽����thisΪwindow����,��������Ҫ����ȡ
		var connList = this.jsPlumbInstance.getConnections();
		var FlagOfHowChange=true;
		if(connList==""){
			return false;
		}
		
		mini.mask({
			el		: document.body,
			html	: "�޸��У����Ժ�...",
			cls		: "mini-mask-loading"
		});

		function chunk(array,process) {
			var i=0,len = array.length;    //����Ҫע����ִ�й�������������ǲ����
			setTimeout(function(){
				process(array[i]);    //ѭ����Ҫ���Ĳ���
				i++;
				if(i < len){	
					setTimeout(arguments.callee,100)  //arguments.callee ������ ���� ��������ִ�е� Function ����
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
		//�޸ĵ�ǰ����
		if(Model.currentLineType == "Straight"){
			Model.currentLineType = "Flowchart";
		}else{
			Model.currentLineType = "Straight";
		}
		$.each(connList,function(index,dom){	
			if(Model.currentLineType == $(connList[index].connector.canvas).data("lineConn").getConnector().type){//�Ѿ��ǵ�ǰ���ͣ������л�
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
	/*�ı䵥���˵���ı���ʾģʽ���ı��Ƿ�����ʾ
		@Param $nodeofDom: �˵��DOM���������߶���
		@Param type:�ڵ������ Model.type
		@Param IfCheck: �Ƿ���и������²���λ�ô���,�������Ҫ������Ϊtrue
	*/
	changeSingelShowCellType:function($nodeofDom,type,IfCheck){
		
		var valueOfWordWrap,Nodetype,$nodesForModefy;
		var $node = $nodeofDom;
		var type=type;
		var IfCheck = IfCheck;
		var _this=this;
		var data = _this.getNodeData($node);		
		
		//���������� connector ����,�������������ݵ�����$node.connector.canvas��
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
					html	: "�޸��У����Ժ�...",
					cls		: "mini-mask-loading"
				});
				setTimeout(function(){
					mini.unmask(document.body);	
					//ɾ��ԭ����������Ϣ
					var canvas = ModelCanvasManager._getModelCanvas();      //�첽����thisΪwindow����,��������Ҫ����ȡ
					
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
					canvas.setNodeData($(Dom.connector.canvas), data);       //��������������
					canvas.nodes[data.code] = $(Dom.connector.canvas);       //��������������
					$(Dom.connector.canvas).data("lineConn", Dom);  //Ҫ����connector��Ϣ
					canvas.updateLineData(Dom);
					//�ػ����ж�һ�¸���
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
			//�ػ����ж�һ�¸���
			if(Nodetype == "ZBJD"||Nodetype == "ZMXJD") {
				_this.jsPlumbInstance.repaint($node);
				if(!IfCheck){
					_this.ReDrawForCover();
				}
			}
		}
	},
	/*�ı�˵���ʾ�ı�����ʽ ��ʽһ��ȫ���Զ����У���Ȳ��䣬�߶����ӣ�����ʽ����������ʾ���߶ȿ�ȶ����䣬�������ڵ������
	*/
	changeShowCellType:function(){
			
		//Ĭ�ϵ�һ��ִ��Ϊ���в��� 
		var _this=this;
		var nodes = this.getNodes();
		var NeedModefyNode=[]; //������Ҫ����Ľڵ�
		
		//ɸѡ��Ч�Ľڵ�
		$.each(nodes,function(index,$dom){
			var data = _this.getNodeData($dom);
			var type = Model.getNodeType(data.lxbm, data.elementType);
			if(type == "LJXJD") {
				if(_this.$qzjdNode){ //�����Ȩ��ҳ��Ͳ�������������ı�ǩ��
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
		$.each(NeedModefyNode,function(index,$dom){ //ͨ��ѭ����������ǰȫ���Ƿ�Ϊ������ʾ����
			var data = _this.getNodeData($dom);
			if(data.wordWrapType==0){ //
				FlagOfALLWrap=false;
			}
			if(data.wordWrapType==1){ //
				FlagOfALLNoWrap=false;
			}
		})
		if(FlagOfALLWrap){//���ж�Ϊ1
			_this.currentIfShowWrap=true;
		}
		if(FlagOfALLNoWrap){//���ж�Ϊ0
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
	/*������л����ͺ��ı����а�ťʱ�����ڸ߶����ã�����ɸ��ǵ��޸�
	*/
	ReDrawForCover:function(){
		/*
		if(this.currentIfShowWrap==0){//�����У���������
			return false;
		}
		*/
		mini.mask({
			el		: document.body,
			html	: "�޸��У����Ժ�...",
			cls		: "mini-mask-loading"
		});

		var FlagIfToCheckCover=true; 	//�Ƿ���Ҫ���
		var nodes = this.getNodes();	//��ȡ������Ҫ���ڵ�
		var ArrayOfCheckDom=[];			//��Ҫ���Ľڵ�
		var _this=this;

		$.each(nodes,function(index,$dom){
			var data = _this.getNodeData($dom);
			var type = Model.getNodeType(data.lxbm, data.elementType);
			var $nodes;
			if(type == "LJXJD") {
				if(_this.$qzjdNode){ //�����Ȩ��ҳ��Ͳ�������������ı�ǩ��
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
				$DomOfShow:$nodes,	//������ʾ��DOM
				$DomOfData:$dom,	//�������ݵ�DOM
				Domtype:type
			}
			ArrayOfCheckDom.push(PushObj);
		})

		var MaxNum=ArrayOfCheckDom.length*ArrayOfCheckDom.length; //���ļ�����-��ֹ��ѭ��
		var FlagOfOut=0;	//�˳�ѭ���ļ�����
		while(FlagIfToCheckCover){

			var IfOver=true; //��ǰ�����ȶԵĽڵ��Ƿ���Ҫ���²���
			//���ݼӹ�
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
			
			jumpout://��������ѭ��
			for(var i=ArrayOfCheckDom.length-1;i>=0;i--){
				//��ǰ�ڵ�
				var $CurrentObj = ArrayOfCheckDom[i];
				
				for(var j=ArrayOfCheckDom.length-1;j>=0;j--){
					//��Ҫ�ȶԽڵ�
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
					
					//�����ж��Ƿ���Ҫ�ƶ�λ��
					if(DistanceX<=MaxWidth&&DistanceY<=MaxHeight){	
						
						IfOver=false;
						
						var $ChangePositionDom = ($CurrentObj.Y>$OtherObj.Y)?$CurrentObj:$OtherObj;
						var $HoldPositionDom =($ChangePositionDom==$CurrentObj)?$OtherObj:$CurrentObj;
						var $MoveDom = $ChangePositionDom.$DomOfData;
						var data = _this.getNodeData($MoveDom);
						/*
						if($ChangePositionDom.Domtype=="LJXJD"&&$HoldPositionDom.Domtype!="LJXJD"){ //����������ߣ����¼� 

							var folNodes = _this.nodes[data.code].data("folNodes")
							//ע�⣺���������ߵ�ʱ���п��ܲ���������
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
							//ע�⣺���������ߵ�ʱ���п��ܲ���������
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
				if(Model.currentLineType == this.data("lineConn").getConnector().type){//�Ѿ��ǵ�ǰ���ͣ������л�
					return true;
				}
			    scope.changeLineType(this.data("lineConn"));
		     }
	     });
	},


	//ep Ϊconnector����
	changeLineType			: function(ep) {
		if(ep=="noNeed"){return true} //�Բ���Ҫ������߽������⴦��ֱ�ӷ���
		//ɾ��ԭ����������Ϣ
		var canvas = ModelCanvasManager._getModelCanvas();      //�첽����thisΪwindow����,��������Ҫ����ȡ
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
		canvas.setNodeData($(ep.connector.canvas), data);       //��������������
		canvas.nodes[data.code] = $(ep.connector.canvas);       //��������������
		$(ep.connector.canvas).data("lineConn", ep);  //Ҫ����connector��Ϣ
		canvas.updateLineData(ep);
	},
	//ɾ����������ǰ���ýڵ������Ϣ
	deleteLineInfo          : function (connector) {
		var $preEle = $("#" + connector.sourceId); //�����ߵ�ǰ�ýڵ�
		var $folEle = $("#" + connector.targetId);     //�����ߵĺ��ýڵ�
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
		if(options.data.position.lineType == "PolyLine" || options.data.position.lineType == "Flowchart") {//������ǰ�ϵ�
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
		this.$jsjdNode = $node;// �����ڵ�
		this.afterCreateJsjd($node);
		return $node;
	},
	afterCreateJsjd			: $.noop,
	_createQzjd				: function(options) {
		options.name = "Ȩ������";
		var $node = this._createElNode(options);
		if(!this.isViewMode()) {
			this._createConnectionNode($node, options);
		}
		this.$qzjdNode = $node;// Ȩ�����ýڵ�

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
            // ��ʼ��ģ������ͼ
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
	 * ��ʼ��ģ������ͼ
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
	//��ȡ��ֹ��$node�ڵ�Ľڵ㼯��
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
						text += data.name || "����";//ֻ�н����ڵ�nameΪ""
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
	 * ���2���ڵ���Ƿ��Ѿ�����������
	 * 
	 * @param {}
	 *            $fromNode ��ʼ�ڵ�
	 * @param {}
	 *            $endNode �����ڵ�
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
	 * �ж���$fromNode, $endNode֮�佨�������ߺ��Ƿ����ͻ�·
	 * 
	 * @param {}
	 *            $fromNode ��ʼ�ڵ�
	 * @param {}
	 *            $endNode �����ڵ�
	 * @return {}
	 */
	_existsCircle			: function(sourceId, $endNode) {
		return this._folNodeById(sourceId, $endNode);
	},
	/**
	 * �ж�$node�Ƿ����������id�ĺ��ýڵ�
	 * 
	 * @param {}
	 *            id Ŀ��ID
	 * @param {}
	 *            $node ���ڵ�
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
	 * ��ȡ�ڵ���
	 * 
	 * @param {Object}
	 *            options
	 * @return {int}
	 */
	getNodeWidth			: function(options) {
		if (options.width) {
			return options.width;
		}

		// �������ֳ��Ȼ�ȡ�ڵ��ȣ����Ϊ200
		var width = 200;
		if (options.name) {
			Model.$cual_span.html(options.name);
			width = Model.$cual_span[0].offsetWidth + 18;
			width = Math.min(width, 200);
		}
		return width;
	},
    /**
     * ����ǰ��У��
     * @param {} nodes ģ�ͽڵ�
     * @param {} doSaveFunction �ص�����
     * @param {} doSaveScope �ص�������scope
     * @return {Boolean} У���Ƿ�ͨ��
     */
	validate				: function(nodes, doSaveFunction, doSaveScope) {
		var scope = this;
		var valid = true;
        // �����ڵ㲻����
        if (!this.$jsjdNode) {
            alert("MXGL.NO_JSJD_NODE");
            return false;
        }
		// ָ��ڵ���Ҫ����������������ڵ㣺�ǽ����ڵ㲻���ں��ýڵ�
        $.each(nodes, function(){
	        if(scope.isLine(this)) {    //�����߲���ҪУ��
		        return true;        //��������ѭ��
	        }
            var $node = this;
            // ָ��ڵ���Ҫ����������������ڵ�
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
		// ������ڽ����ڵ�����ڵ㣺�ڵ㼯�ϵ��������ʼ�ڵ����Ƿ���ͬ
		if (nodes.length == this.initNodesLen) {
			alert("MXGL.NO_NODES");
			return false;
		}

		return this.modelValidate(nodes, doSaveFunction, doSaveScope);
	},
	/**
     * ����ǰ��У��
     * @param {} nodes ģ�ͽڵ�
     * @param {} doSaveFunction �ص�����
     * @param {} doSaveScope �ص�������scope
     * @return {Boolean} У���Ƿ�ͨ��
     */
	modelValidate			: function(nodes, doSaveFunction, doSaveScope) {
		return true;
	},
	/**
	 * ���������ж��������
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
	 * ��������
	 * 
	 * @param skipValidate ����У��Ŀ���
	 * @param doSaveFunction �ص�����
	 * @param scope �ص�������scope
	 * @return {Array} mxjds
	 */
	save					: function(skipValidate, doSaveFunction, doSaveScope) {
		var scope = this;
        var nodes = this.getNodes();
		if (skipValidate || this.validate(nodes, doSaveFunction, doSaveScope)) {
			// ģ�ͽڵ���������
			var mxjds = [];
            $.each(nodes, function(){
                var $node = this;
	            var data = scope.getNodeData($node, true); // �ڵ���Ϣ
                data = scope._filterData(data);
                //��Ϊ�Զ���ģ�ͣ��Զ���ģ������Ϊ�ڵ�����
                if(data.mx && data.mx.zmxbz === 'Y'){
                    data.mx.name = data.name;
                }else{//��Ϊ��������ģ��
                    delete data.mx;
                }
                // ǰ�ýڵ�
	            var $preNodes = $node.data("preNodes") || [];
                var preElements = [];
                $.each($preNodes, function() {
	                var connectorData = scope.getNodeData(this, true);
	                preElements.push(connectorData.code);
                });
                data.preElements = preElements;
                // ���ýڵ�
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
 * ������ģ��
 * 
 * @param {}
 *            options
 */
Model.DTreeModelCanvas = function(options) {
	this.options = $.extend(this.options, options || {});
	this.$jsjdNode = null;// �����ڵ�
	Model.ModelCanvas.call(this, this.options);
}
$.extend(Model.DTreeModelCanvas.prototype, Model.ModelCanvas.prototype, {
	_create				: function() {
		// ���� ��ʼ���������ڵ�+Ԥ���ڵ�
		if ('[%HTML::TEXT.show_yjjd%]') {
			// TODO ����Ԥ���ڵ�
		}
		// ���������ڵ�
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
			// �ڵ�·�������仯
			this.$canvas.bind("ljxChanged", Mxdfsz.onLjxChanged);
		}
	},
	/**
	 * ģ��У��
	 * @param {} nodes ģ�ͽڵ�
	 * @param {} doSaveFunction �ص�����
	 * @param {} doSaveScope �ص�������scope
	 * @return {Boolean} У���Ƿ�ͨ��
	 */
	modelValidate		: function(nodes, doSaveFunction, doSaveScope) {
		var scope = this;
		var valid = true;

		if (this.$jsjdNode) {
			//�����ڵ�����ʽΪ�գ���Ĭ��Ϊ���
			var data = scope.getNodeData(this.$jsjdNode, true);
			if(!data.dfgs){
				formula.setData(null);
				formula.isHidden = true;
				formula.addOperand("sum", "���", "sum", Gsys.TYPE_YYCS);
				data.dfgs = formula.getData();
			}
			scope.setNodeData(this.$jsjdNode, data);
			// �ڵ��Ƿ���ֹ�ڽ����ڵ㣺·���еĽڵ�����ڵ㼯�ϵĽڵ����Ƿ���ͬ
			var paths = this.getPathsToNode(this.$jsjdNode);
			var pathValues = [];// ȫ��·���ϵĽڵ�
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
				// �ڵ��Ƿ���ֹ�ڽ����ڵ�
				alert("MXGL.NODE_NOT_ENDWITH_JSJD");
				return false;
			}
		}

		// ɸѡ����δ����
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
						alert({"MXGL.DTREE_SXTJ_UNDEFINE": ["δ֪"]});
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
 * Ȩ����ģ��
 * 
 * @param {}
 *            options
 */
Model.LRegressorModelCanvas = function(options) {
	this.options = $.extend(this.options, options || {});

	this.$jsjdNode = null;// �����ڵ�
	this.$qzjdNode = null;// Ȩ�����ýڵ�

	Model.ModelCanvas.call(this, this.options);
}
$.extend(Model.LRegressorModelCanvas.prototype, Model.ModelCanvas.prototype, {
	initNodesLen		: 3,// ��ʼ�ڵ���
	_beforeCreateNode	: function(options) {
        var scope = this;
        var returnVal = true;
		// ָ���ģ�Ͳ����ظ�����
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
		// ���������ڵ�
		this.__createJsjd();
		// ����Ȩ�����ýڵ�
		this.__createQzjd();
		// ����Ȩ�ؽڵ㵽�����ڵ�������߽ڵ�
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
		// ����������ϵ
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
	 * ���������ڵ�
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
	 * ����Ȩ�ؽڵ�
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
	 * ����Ȩ�ؽڵ㵽�����ڵ�������߽ڵ�
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
		// ����������ϵ
		$(connector.connector.canvas).data("preNodes", [this.$qzjdNode]);
		$(connector.connector.canvas).data("folNodes", [this.$jsjdNode]);
		this.$qzjdNode.data("folNodes", [$(connector.connector.canvas)]);
		this.$jsjdNode.data("preNodes", [$(connector.connector.canvas)]);
		return connector;
	},
	/**
	 * ģ��У��
	 * @param {} nodes ģ�ͽڵ�
	 * @param {} doSaveFunction �ص�����
	 * @param {} doSaveScope �ص�������scope
	 * @return {} У���Ƿ�ͨ��
	 */
	modelValidate		: function(nodes, doSaveFunction, doSaveScope) {
        var scope = this;
        var valid = true;
        $.each(nodes, function(){
            var $node = this;
            // Ȩ��δ����
            if (scope.isFxysjd($node)) {
                var data = scope.getNodeData($node, true);
                if (data.qz == "" || data.qz == undefined) {
                    alert("MXGL.FXYS_QZ_UNDEFINED");
                    valid = false;
                    return false;
                }

                // ��ģ��У��
                if (valid && scope.isMxjd($node) && (data.mx && data.mx.zmxbz == 'Y')) {
                    if (!data.mx.mxjds || data.mx.mxjds.length == 0) {
                        alert("MXGL.ZMX_DEFINE_IMPERFECT");
                        valid = false;
                        return false;
                    }
                }
            }
         
        });
        //�жϹ�ʽ���Ƿ���ڽڵ㲻���ڵ�ָ���ָ��Ԫ��ģ��
        if(this.$qzjdNode){
            var data = this.getNodeData(this.$qzjdNode, true);
            var zbnames = QzMxdfsz.hasZbInFormula(data.dfgs,this.getFxsyNodes());
            if(zbnames!=""){
            	//�����нڵ㲻���ڣ���ʾ�û��Ƿ�ʹ���Զ����ɵĹ�ʽ
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
 * ���ģ��
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
	 * ģ��У��
	 * @param {} nodes ģ�ͽڵ�
	 * @param {} doSaveFunction �ص�����
	 * @param {} doSaveScope �ص�������scope
	 * @return {} У���Ƿ�ͨ��
	 */
	modelValidate	: function(nodes, doSaveFunction, doSaveScope) {
        var scope = this;
		var valid = Model.DTreeModelCanvas.prototype.modelValidate.call(this, nodes);
		if (valid) {
            $.each(nodes, function(){
                var $node = this;
                var data = scope.getNodeData($node, true);

                // ��ģ��У��
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
         * ģʽ��editΪ�༭ģʽ��viewΪ�鿴ģʽ��adjustΪ����ģʽ��������ɾ����,adjustAndDelΪ����ɾ��ģʽ
         */
		status			: 'edit',
        openTabId       : null,//������TabID
		parentNodeId	: null,// ���ڵ�ID
		data			: {},
        allowClose      : true,//�Ƿ�����ر�window
        afterSave       : false,//����ص�����
        afterClose      : false//�رջص�����
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
	 * ��ȡ��ǰģ�͵����ͣ������ǰ����Ϊ��ģ�;�����ģ�����ͣ�
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
     * �Ƿ��һ������
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
		if (!data) {// У�鲻ͨ��
			return;
		}
		if (modelCanvas == this.modelCanvas) {
            var success = true;
            if(this.options.openTabId && this.options.openTabId != "undefined"&& this.options.openTabId != "-1"){//-1��ʾû�и�ҳ��
                try {
	                success = parent.opener.PageContainer.setActiveTab(this.options.openTabId);
	                if(!success){
	                    alert({"MXGL.MODEL_EDIT_WIN_UNFIND":["����"]});
	                    return;
	                }
	            } catch (e) {//��ҳ���ѹر�
	                success = false;
	                alert({"MXGL.MODEL_EDIT_WIN_UNFIND":["����"]});
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
	/*�ı�˵���ʾ�ı�����ʽ ��ʽһ��ȫ���Զ����У���Ȳ��䣬�߶����ӣ�����ʽ����������ʾ���߶ȿ�ȶ����䣬�������ڵ������
	*/
	changeShowCellType:function(){
		var modelCanvas = this._getModelCanvas();
		modelCanvas.changeShowCellType();
	},
	/*�ı䵥���˵���ı���ʾģʽ���ı��Ƿ�����ʾ
		@Param $node: �˵��DOM���������߶���
		@Param type:�ڵ������ Model.type
	*/
	changeSingelShowCellType:function($node,type){
		var modelCanvas = this._getModelCanvas();
		modelCanvas.changeSingelShowCellType($node,type);
	}
}