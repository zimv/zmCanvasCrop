
	function CanvasCrop(opt){
		this.init(opt);
	}

	CanvasCrop.prototype = {

		_$box : '',
		_$canvasDown: '',
		_$canvasUp: '',
		_input : '',
		_ctxUp: '',//裁剪区域canvas
		_img : '',
		_img_show: {
			width: '',
			height: '',
			scale: '', //显示像素除以实际像素
			crop_width: '',//要裁剪部分显示宽
			crop_height: '',
			min_width: '',//要裁剪部分显示最小宽度
			min_height: ''
		},

		_option : {
			crop_box_width: '',			//图片操作区域宽限制
			crop_box_height: '',			//图片操作区域高限制
			crop_min_width: '',		//剪裁实际最小像素宽
			crop_min_height: '',	//剪裁实际最小像素高
			crop_scale: '' //宽高比
		},
		_save: {
			left: '',
			top: '',
			width: '',
			height: ''
		},
		_resize_point: {
			color: '#69f',
			size: 8
		},
		_resize_btn: {},

		init: function(opt){
			var self = this;
			self._input = document.getElementById(opt[0]);

			self._$box = $('.canvas-box');
			self.readFile();

			$('[data-action="saveCrop"]').on('click', function(){
				self.save();
			});
		},

		imgTrue: function(){
			if(this._img.width < this._option.crop_min_width || this._img.height < this._option.crop_min_height){
				return false;
			}
			return true;
		},

		readFile: function(){
			var self = this;

			if(typeof FileReader==='undefined'){ 
			    alert("抱歉，你的浏览器不支持 FileReader"); 
			    input.setAttribute('disabled','disabled'); 
			}else{ 
			    this._input.addEventListener('change', readFile, false);
			} 

			function readFile(){ 
			    var file = this.files[0]; 
			    if(!/image\/\w+/.test(file.type)){ 
			        alert("文件必须为图片！"); 
			        return false; 
			    } 
			    var reader = new FileReader(); 
			    reader.readAsDataURL(file); 
			    reader.onload = function(e){ 
			        //result.innerHTML = '<img src="'+this.result+'" alt=""/>'

			        self.drawCavDown(this.result);
			   	    
			    } 
			}
		},

		drawCavDown: function(src){
			var self = this;
			//清除上一次的
			self._$box.html('');
			self._save = {};
			self._img_show = {};

			self._img = new Image();

		    self._img.onload = function(){

		    	if(!self.imgTrue()){
		    		alert('图片大小必须大于:' + self._option.crop_min_width + '*' + self._option.crop_min_height);
		    		return;
		    	} 
		    	//让宽或者高撑满
		    	self.setShowImg();
		    	self._img_show.scale = self._img_show.width / self._img.width;//缩放比例
		    	//计算裁剪高亮区域的最小宽高
		    	self._img_show.min_width = self._option.crop_min_width * self._img_show.scale;
		    	self._img_show.min_height = self._option.crop_min_height * self._img_show.scale;

				//初始化显示剪裁框宽高
				self.resizeCrop({
					width: self._option.crop_min_width,
					height: self._option.crop_min_height
				});
		      
		      	//绘制底层剪裁区域
		      	drawDown();

		      	//载入上层canvas
		      	self.addUpCanvas();
		      	//绑定松开鼠标事件
		      	$(document).on('mouseup', function(){//在外部松开
					$(document).off('mousemove');
/*					$('.resize-point').off('mousedown');
					self._$canvasUp.off('mousedown');
					self.upCanvasEvent();
					self.resizeEvent();*/
				});
		    }

		    self._img.src = src;

		    function drawDown(){
		    	var $canvas = $('<canvas width="' + self._img_show.width  + '" height="' + self._img_show.height + '"></canvas>');
				self._$box.append($canvas);
		      	var $ctx = $canvas[0].getContext('2d');
		      	$ctx.drawImage(self._img, 0, 0, self._img_show.width, self._img_show.height);
				//裁剪区域透明
				$ctx.beginPath();
				$ctx.fillStyle="rgba(0,0,0,0.6)";
				$ctx.fillRect(0, 0, self._img_show.width, self._img_show.height);

				for(var i=1;i<5;i++){
					$ctx.moveTo(self._img_show.width/5*i,0);
					$ctx.lineTo(self._img_show.width/5*i, self._img_show.height);
					$ctx.moveTo(0, self._img_show.height/5*i);
					$ctx.lineTo(self._img_show.width, self._img_show.height/5*i);
					$ctx.strokeStyle="rgba(255,255,255,0.9)";
					$ctx.stroke();
				}
				
				self._$canvasDown = $canvas;
			}

		},
		setResizePoint: function(direction, left, top){
			return $('<div class="resize-point" style="width:' + this._resize_point.size +'px;height:' + this._resize_point.size + 'px;'+
				'background: ' + this._resize_point.color + ';cursor:'+ direction +';position:absolute;'+
				'left:'+ left +'px;top:'+ top +'px"></div>');
		},

		addUpCanvas: function(){
			
			var self = this;
			self.addResizeBtn();//添加放大缩小按钮

			self._ctxUp = self._$canvasUp[0].getContext('2d'); 
			self._ctxUp.drawImage(self._img,  0, 0, self._img_show.crop_width / self._img_show.scale, self._img_show.crop_height / self._img_show.scale,0, 0, self._img_show.crop_width, self._img_show.crop_height);
		
			//初始化实际存储
			self._save.left = 0;
			self._save.top = 0;
			self._save.width = self._img_show.crop_width / self._img_show.scale;
			self._save.height = self._img_show.crop_height / self._img_show.scale;

			self.upCanvasEvent();
		},
		//绑定鼠标按下事件
		upCanvasEvent: function(){
			var self = this;
			self._$canvasUp.on('mousedown', cavMouseDown);

			function cavMouseDown(e){
				var canv = this;

				//获取到按下时，鼠标和元素的相对位置,相对偏差
				var relativeOffset = { x: e.clientX - $(canv).offset().left, y: e.clientY - $(canv).offset().top };
				$(document).on('mousemove', function(e){
					//阻止移动出图片区域
					if(countPosition().left >= self._img_show.width - self._img_show.crop_width || countPosition().left <= 0) relativeOffset.x = e.clientX - $(canv).offset().left;

					if(countPosition().top >= self._img_show.height - self._img_show.crop_height || countPosition().top<=0) relativeOffset.y = e.clientY - $(canv).offset().top;

					$(canv).css({left: countPosition().left, top: countPosition().top });//移动上层canvas

					//实际存储
					self._save.left = countPosition().left / self._img_show.scale;
					self._save.top = countPosition().top / self._img_show.scale;
					self._save.width = self._img_show.crop_width / self._img_show.scale;
					self._save.height = self._img_show.crop_height / self._img_show.scale;

					//重绘剪裁区域
					self._ctxUp.drawImage(self._img, 
						self._save.left, self._save.top, self._save.width, self._save.height,
						0, 0, self._img_show.crop_width, self._img_show.crop_height
					);
					
					//设置缩放按钮位置
					self.resizePosition();
					function countPosition(){
						var left = (e.clientX - relativeOffset.x) - self._$canvasDown.offset().left;//还要减去父元素到左边窗口的距离
						var top = (e.clientY - relativeOffset.y) - self._$canvasDown.offset().top;//还要减去父元素到左边窗口的距离
						return {left: left, top: top}
					}
				});
			}
		},
		addResizeBtn: function(){
			var self = this;
			//载入方向按钮
			var $seResize =	self.setResizePoint('se-resize', self._img_show.crop_width - self._resize_point.size/2, self._img_show.crop_height - self._resize_point.size/2);
			var $swResize = self.setResizePoint('sw-resize', -self._resize_point.size/2, self._img_show.crop_height - self._resize_point.size/2);
			var $neResize = self.setResizePoint('ne-resize', self._img_show.crop_width - self._resize_point.size/2, -self._resize_point.size/2);
			var $nwResize = self.setResizePoint('nw-resize', -self._resize_point.size/2, -self._resize_point.size/2);

			var $canvas = $('<canvas class="overlay" width="' + self._img_show.crop_width  + '" height="' + self._img_show.crop_height + '"></canvas>');
			
			self._$box.append($canvas);
			self._$canvasUp = $canvas;

			self._$box.append($seResize);
			self._$box.append($swResize);
			self._$box.append($neResize);
			self._$box.append($nwResize);

			self._resize_btn.$se = $seResize;
			self._resize_btn.$sw = $swResize;
			self._resize_btn.$ne = $neResize;
			self._resize_btn.$nw = $nwResize;
		
			self.resizeEvent();
		},
					//绑定方向按钮事件
		resizeEvent: function(){
			var self = this;
			$('.resize-point').on('mousedown', function(){

				var pLeft = $(this).position().left + self._resize_point.size/2,
					pTop = $(this).position().top + self._resize_point.size/2;
				var upLeft = self._$canvasUp.position().left,
					upTop = self._$canvasUp.position().top;
				var noChangeX,noChangeY;
				if(upLeft >= pLeft) noChangeX = -(upLeft + self._img_show.crop_width);//为负在右
				else noChangeX = upLeft;
				if(upTop >= pTop) noChangeY = -(upTop + self._img_show.crop_height);//为负在下
				else noChangeY = upTop;

				$(document).on('mousemove', function(e){
					if(noChangeX >= 0 ){
						self._$canvasUp.css("left", noChangeX)
					}else{
						self._$canvasUp.css("left",  Math.abs(noChangeX) - self._img_show.crop_width);
					}
					if(noChangeY >= 0 ){
						self._$canvasUp.css("top", noChangeY)
					}else{
						self._$canvasUp.css("top",  Math.abs(noChangeY) - self._img_show.crop_height);
					}
					//阻止移动出图片区域
					self._img_show.crop_width = Math.abs(Math.abs(noChangeX) - countPosition().left);
					self._img_show.crop_height = self._img_show.crop_width / self._option.crop_scale;
					if(noChangeX >= 0 && noChangeX + self._img_show.crop_width > self._img_show.width){
						self._img_show.crop_width = self._img_show.width - noChangeX;
						self._img_show.crop_height = self._img_show.crop_width / self._option.crop_scale;
					}else if(noChangeX < 0 && Math.abs(noChangeX) - self._img_show.crop_width < 0 ){
						self._img_show.crop_width = Math.abs(noChangeX);
						self._img_show.crop_height = self._img_show.crop_width / self._option.crop_scale;
					}
					if(noChangeY >= 0 && noChangeY + self._img_show.crop_height > self._img_show.height) {
						self._img_show.crop_height = self._img_show.height - noChangeY;
						self._img_show.crop_width = self._img_show.crop_height * self._option.crop_scale;
					}else if(noChangeY < 0 && Math.abs(noChangeY) - self._img_show.crop_height < 0){
						self._img_show.crop_height = Math.abs(noChangeY);
						self._img_show.crop_width = self._img_show.crop_height * self._option.crop_scale;
					}
					//如果宽高小于限制
					if(self._img_show.crop_width < self._img_show.min_width){
						self._img_show.crop_width = self._img_show.min_width;
						self._img_show.crop_height = self._img_show.crop_width / self._option.crop_scale;
					}
					if(self._img_show.crop_height < self._img_show.min_height){
						self._img_show.crop_height = self._img_show.min_height;
						self._img_show.crop_width = self._img_show.crop_height / self._option.crop_scale;
					}

					//实际存储
					if(noChangeX>=0){
						self._save.left = noChangeX / self._img_show.scale;
					}else{
						self._save.left = (Math.abs(noChangeX) - self._img_show.crop_width) / self._img_show.scale;
					}
					if(noChangeY>=0){
						self._save.top = noChangeY / self._img_show.scale;
					}else{
						self._save.top = (Math.abs(noChangeY) - self._img_show.crop_height) / self._img_show.scale;
					}
					self._save.width = self._img_show.crop_width / self._img_show.scale;
					self._save.height = self._img_show.crop_height / self._img_show.scale;

					//重绘剪裁区域,修改属性宽高，否则无效
					self._$canvasUp.attr("width", self._img_show.crop_width);
					self._$canvasUp.attr("height", self._img_show.crop_height);
					self._ctxUp.drawImage(self._img, 
						self._save.left, self._save.top, self._save.width, self._save.height,
						0, 0, self._img_show.crop_width, self._img_show.crop_height
					);
					self.resizePosition();
		
					function countPosition(){//鼠标在底层canvas的相对位置
						var left = e.clientX - self._$canvasDown.offset().left ;
						var top = e.clientY - self._$canvasDown.offset().top ;
						return {left: left, top: top}
					}

				});

			});
			
		},
		resizePosition: function(){
			var self = this;
			self._resize_btn.$se.css({left: self._$canvasUp.position().left + self._img_show.crop_width- self._resize_point.size/2, top: self._$canvasUp.position().top + self._img_show.crop_height - self._resize_point.size/2});//加上宽高,减去本身大小
			self._resize_btn.$sw.css({left: self._$canvasUp.position().left - self._resize_point.size/2, top: self._$canvasUp.position().top + self._img_show.crop_height - self._resize_point.size/2});//加上宽高,减去本身大小
			self._resize_btn.$ne.css({left: self._$canvasUp.position().left + self._img_show.crop_width - self._resize_point.size/2, top: self._$canvasUp.position().top - self._resize_point.size/2});//加上宽高,减去本身大小
			self._resize_btn.$nw.css({left: self._$canvasUp.position().left - self._resize_point.size/2, top: self._$canvasUp.position().top - self._resize_point.size/2});//加上宽高,减去本身大小
		},
		//保存
		save: function(){
			var self = this;
			$result = $("<canvas width='"+ self._save.width +"' height='"+ self._save.height +"'></canvas>");
			$('body').append($result);
			$result[0].getContext('2d').drawImage(self._img, 
				self._save.left, self._save.top, self._save.width, self._save.height,
				0, 0, self._save.width, self._save.height
			);

			var base64Url = $result[0].toDataURL('image/jpeg');

			setTimeout(function(){//延迟为了避免执行日志输出时，base64url还未生成，就会输出为空
				console.log(base64Url);
			}, 100);
				
		},
		
		
		//显示的图片大小,三种结果，撑满宽或者高，或者原图大小
		setShowImg: function(){
			if( this._img.width <= this._option.crop_box_width && this._img.height <= this._option.crop_box_height ) {
				this._img_show.width = this._img.width;
				this._img_show.height = this._img.height;
				return;
			}
			var weight = 0;//设置权重
			if( this._img.width > this._option.crop_box_width ) weight+=10;
			if( this._img.height > this._option.crop_box_height ) weight-=10;
			if( this._img.width / this._img.height > this._option.crop_box_width / this._option.crop_box_height) weight+=5;
			else weight-=5;
			if( this._img.width >= this._img.height ) weight++;
			else weight--;


			if(weight > 0){//撑满宽度
				this._img_show.width = this._option.crop_box_width;
				this._img_show.height =  this._option.crop_box_width / ( this._img.width / this._img.height );
			}else{//撑满高度
				this._img_show.height = this._option.crop_box_height;
				this._img_show.width =  this._option.crop_box_height / ( this._img.height / this._img.width );
			}

			
		},

		resizeCrop: function(real){//剪裁框大小
			this._img_show.crop_width = real.width * this._img_show.scale;
			this._img_show.crop_height = real.height * this._img_show.scale;
		}


	}

	
