// configs
const minimumSize = { width: 150, height: 100 };
const stickyArea = 20; //px

//intersection
function intersectRect(r1, r2) {
    var leftRight = r2.left > r1.right || 
        r2.right < r1.left;
    var topBottom = r2.top > r1.bottom || r2.bottom < r1.top;
    return !(leftRight || topBottom);
}

function clientBoundsSticky(clientBounds){
    return {
        left: clientBounds.left - stickyArea,
        bottom: clientBounds.bottom + stickyArea,
        top: clientBounds.top - stickyArea,
        right: clientBounds.right + stickyArea,
    }
}

/**
 * div - selector of resizable, draggable elem
 * container - selector of container of div (restricted area selector)
 */
function initDraggableFields(div, container) {
    const element = document.querySelector(div);
    const resizers = document.querySelectorAll(div + ' .resizer')
    const limitContainer = document.querySelector(container);
    const limitX = {
        from: limitContainer.getBoundingClientRect().left,
        to: limitContainer.getBoundingClientRect().left + limitContainer.offsetWidth
    };
    const limitY = {
        from: limitContainer.getBoundingClientRect().top,
        to: limitContainer.getBoundingClientRect().top + limitContainer.offsetHeight
    };

    let original_width = 0;
    let original_height = 0;
    let original_x = 0;
    let original_y = 0;
    let original_mouse_x = 0;
    let original_mouse_y = 0;

    function getParentBlock(node) {
        return node.closest('.resizable');
    }

    function removeBlock(e) {
        getParentBlock(e.target).classList.add('deleted');
    }

    function returnBlock(e) {
        getParentBlock(e.target).classList.remove('deleted');
    }

    //delete & return
    element.querySelector('.delete').addEventListener('click', removeBlock);
    element.querySelector('.return').addEventListener('click', returnBlock);

    //drag & resize
    for (let i = 0; i < resizers.length; i++) {
        const currentResizer = resizers[i];
        currentResizer.addEventListener('mousedown', function (e) {
            e.stopPropagation();
            e.preventDefault()

            original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
            original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
            original_x = element.getBoundingClientRect().left;
            original_y = element.getBoundingClientRect().top;
            original_mouse_x = e.pageX;
            original_mouse_y = e.pageY;
            window.addEventListener('mousemove', resizeDrag)
            window.addEventListener('mouseup', stopResizeDrag)
        })

        function resizeDrag(e) {
            e.stopPropagation();
            const parent = getParentBlock(e.target);
            if (parent !== null) {
                const id = parent.getAttribute('id');

                if (currentResizer.classList.contains('bottom-right')) {
                    const width = original_width + (e.pageX - original_mouse_x)
                    const height = original_height + (e.pageY - original_mouse_y)
                    resizeDiv(id, width, height);
                } else if (currentResizer.classList.contains('top-left')) {
                    let x = e.pageX + (original_x - original_mouse_x);
                    let y = e.pageY + (original_y - original_mouse_y);
                    dragDiv(id, x, y);
                }
            }
        }

        function stopResizeDrag(e) {
            const parent = getParentBlock(e.target);
            if (parent !== null) {
                if (currentResizer.classList.contains('bottom-right') || currentResizer.classList.contains('top-left')) {
                    resizeSticky(parent);   
                }
            }
            window.removeEventListener('mousemove', resizeDrag)
        }

        function isTopSitcked(elTop, block){
            var diff = elTop - block.bottom;
            return diff >= 0 && diff <= stickyArea;
        }
        function isBottomSitcked(elBottom, block){
            var diff = block.top - elBottom;
            return diff >= 0 && diff <= stickyArea;
        }
        function isLeftSitcked(elLeft, block){
            var diff = elLeft - block.right;
            return diff >= 0 && diff <= stickyArea;
        }
        function isRightSitcked(elRight, block){
            var diff = block.left - elRight;
            return diff >= 0 && diff <= stickyArea;
        }

        function resizeSticky(block){
            var nodeId = block.getAttribute('id');
            var xCoord = block.getBoundingClientRect().right;
            var yCoord = block.getBoundingClientRect().bottom;
            
            //blocks for sticky
            let nearestLimits = getNearestResizeLimit(nodeId, xCoord, yCoord, true);

            var sticky = {
                topDiff: stickyArea * 2,
                bottomDiff: stickyArea * 2,
                leftDiff: stickyArea * 2,
                rightDiff: stickyArea * 2
            }

            for(var i = 0; i < nearestLimits.length; i++){
                if(isTopSitcked(block.getBoundingClientRect().top, nearestLimits[i])){
                    sticky.topDiff = block.getBoundingClientRect().top - nearestLimits[i].bottom;
                }else if(isBottomSitcked(block.getBoundingClientRect().bottom, nearestLimits[i])){
                    sticky.bottomDiff = nearestLimits[i].top - block.getBoundingClientRect().bottom;
                }else if(isLeftSitcked(block.getBoundingClientRect().left, nearestLimits[i])){
                    sticky.leftDiff = block.getBoundingClientRect().left - nearestLimits[i].right;
                }else if(isRightSitcked(block.getBoundingClientRect().right, nearestLimits[i])){
                    sticky.rightDiff = nearestLimits[i].left - block.getBoundingClientRect().right;
                }
            }

            var stickyLimitMax = stickyArea * 2;
            if ((sticky.topDiff ?? stickyLimitMax) < (sticky.bottomDiff ?? stickyLimitMax)) {
                if(sticky.topDiff <= stickyArea){
                    block.style.top = block.getBoundingClientRect().top - (sticky.topDiff - 1) + 'px';
                }
            }
            if (sticky.topDiff ?? stickyLimitMax > sticky.bottomDiff ?? stickyLimitMax) {
                if(sticky.bottomDiff <= stickyArea){
                    block.style.top = block.getBoundingClientRect().top + sticky.bottomDiff - 1 + 'px';
                }
            }

            if ((sticky.leftDiff ?? stickyLimitMax) < (sticky.rightDiff ?? stickyLimitMax)) {
                if(sticky.leftDiff <= stickyArea){
                    block.style.left = block.getBoundingClientRect().left - (sticky.leftDiff - 1) + 'px';
                }
            }
            
            if ((sticky.leftDiff ?? stickyLimitMax) > (sticky.rightDiff ?? stickyLimitMax)) {
                if(sticky.rightDiff <= stickyArea){
                    block.style.left = block.getBoundingClientRect().left + (sticky.rightDiff - 1) + 'px';
                }
            }
        }

        function resizeDiv(nodeId, width, height) {
            let xCoord = width + original_x;
            let yCoord = height + original_y;
            let nearestLimits = getNearestResizeLimit(nodeId, xCoord, yCoord);

            if (width >= minimumSize.width && xCoord < nearestLimits.x) {
                element.style.width = width + 'px'
            }

            if (height >= minimumSize.height && yCoord < nearestLimits.y) {
                element.style.height = height + 'px'
            }
        }

        function getNearestResizeLimit(nodeId, xCoord, yCoord, sticky = false) {
            let limits = [];
            if(!sticky){
                limits['x'] = limitX.to;
                limits['y'] = limitY.to;
            }

            var blocks = limited.querySelectorAll('.resizable');

            for (i = 0; i < blocks.length; ++i) {
                if (blocks[i].getAttribute('id') !== nodeId && blocks[i].classList.contains('deleted') == false) {

                    let blockBounds = blocks[i].getBoundingClientRect();
                    let elementBounds = element.getBoundingClientRect();

                    if(sticky){
                        elementBounds = clientBoundsSticky(elementBounds);
                        if(intersectRect(elementBounds, blockBounds)){
                            limits.push(blockBounds);
                        }
                    }else{
                        if(intersectRect(elementBounds, blockBounds)){
                            if (blockBounds.left < limits['x']) {
                                limits['x'] = blockBounds.left;
                            }
                            if (blockBounds.top < limits['y']) {
                                limits['y'] = blockBounds.top;
                            }
                        }
                    }
                }
            }

            return limits;
        }

        function limitedSizes(){
            var sizes = {
                width: original_width,
                height: original_height
            };
            let current_x = element.getBoundingClientRect().left;
            let current_y = element.getBoundingClientRect().top;

            //resize if limit riched
            if(current_y + original_height > limitY.to){
                let diff_y = (current_y + original_height) - limitY.to;
                sizes.height = original_height - diff_y;
                sizes.height = Math.max(sizes.height, minimumSize.height);
            }

            if(current_x + original_width > limitX.to){
                let diff_x = (current_x + original_width) - limitX.to;
                sizes.width = original_width - diff_x;
                sizes.width = Math.max(sizes.width, minimumSize.width);
            }

            return sizes;
        }

        function dragDiv(nodeId, pageX, pageY) {
            //allowed min range
            if (pageX > limitX.from && pageX < limitX.to - minimumSize.width) {
                element.style.left = pageX + 'px';
            }

            //allowed min range
            if (pageY > limitY.from && pageY < limitY.to - minimumSize.height) {
                element.style.top = pageY + 'px';
            }

            //change sizes to limits
            let sizes = limitedSizes();
            original_height = sizes.height;
            original_width = sizes.width;
            
            resizeDiv(nodeId, sizes.width, sizes.height);
        }
    }
}

//init

add.addEventListener('click', () => {
    var blocksCount = limited.querySelectorAll('.resizable').length;
    if (blocksCount < 10) {
        let node = block.content.cloneNode(true);
        let nodeId = 'block_' + (blocksCount + 1);
        node.querySelector('.resizable').setAttribute('id', nodeId);
        limited.append(node);
        initDraggableFields(`#${nodeId}`, '.limited');
        blocksCountText.textContent = blocksCount + 1;
    }
}, false);