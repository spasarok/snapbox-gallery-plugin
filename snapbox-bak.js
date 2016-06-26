jQuery(document).ready( function($) {

    /*
     * Variables
     */

    var host = 'http://' + window.location.hostname + ':8888/kv';
    var images = {};

    // Class prefixes and constants
    var pre = {
        thumbID: 'attachment-thumbnail',
        key: 'obj-',
        imageID: 'snapbox-img-',
        next: 'next',
        prev: 'prev',
        lightbox: 'light'
    };


    // State data
    var state = {
        imObj: {},          // Image object currently being stateed
        lastPushed: null,   // Last image pushed to the image array
        closeButton: null,  // Close button element
        prevButton: {},     // Button for toggling previous
        nextButton: {},     // Button for toggling next
        closeButton: {el: null},    // Button for closing lightbox
        first: null,        // True if at the first image
        last: null,         // True if at the last image
        lightbox: {},       // Lightbox element
        imagebox: null,      // Imagebox element
        gal: snapvals.gallery // Unique gallery ID
    };

    console.log(state.gal);

    // Main method
    function main(){
        buildView();
        setImages();
    }

    main();

    /*
     * Build the view
     */

    function buildView(){
        buildLightbox();
        buildImagebox();
    }

    function buildLightbox(){
        var lightbox = $(document.createElement('div')).addClass('snapbox-lightbox').addClass('snapbox-lightbox-' + state.gal);
        $('body').append(lightbox);
        state.lightbox = new Light(lightbox);
    }

    function buildImagebox(){
        var nextButton = $(document.createElement('div')).addClass('snapbox-control-toggle-next');
        var prevButton = $(document.createElement('div')).addClass('snapbox-control-toggle-prev');
        var closeButton = $(document.createElement('div')).addClass('snapbox-control-close');
        state.imagebox = $(document.createElement('div')).addClass('snapbox-imagebox');
        state.lightbox.el.append(state.imagebox);
        state.imagebox.append(nextButton);
        state.imagebox.append(prevButton);
        state.nextButton = new Toggle(nextButton, pre.next);
        state.prevButton = new Toggle(prevButton, pre.prev);
        state.closeButton.el = closeButton;
        state.lightbox.el.append(closeButton);
    }

    /*
     * Lightbox Prototype
     */

    function Light(el) {
        this.el = el;
        this.visible = false;
    }

    // Toggle lightbox on
    Light.prototype.protoShow = function(){
        if(state.imObj.next == null)
            state.nextButton.el.hide();
        else
            state.nextButton.el.show();

        if(state.imObj.prev == null)
            state.prevButton.el.hide();
        else
            state.prevButton.el.show();

        this.el.show();
        this.visible = true;
    }

    // Toggle lightbox off
    Light.prototype.protoHide = function(){
        this.el.hide();
        this.visible = false;
        state.imObj.protoHide();
        state.imObj = null;
    }

    /*
     * Toggle Prototypes (Previous/Next Buttons)
     */

    function Toggle(el, type) {
        var toggle = this;
        this.el = el;
        this.type = type;
        var el = el;
        var type = this.type;

        // Click event for previous button
        if(type == pre.prev){
            toggle.el.click(function(){
                state.imObj.protoHide();
                state.imObj = state.imObj.prev;
                state.imObj.protoShow();

                if(state.imObj.prev == null)
                    el.hide();

                if(state.imObj.next != null)
                    state.nextButton.el.show();
            });
        }

        // Click event for next button
        else if(type == pre.next){
            toggle.el.click(function(){
                state.imObj.protoHide();
                state.imObj = state.imObj.next;
                state.imObj.protoShow();

                if(state.imObj.next == null)
                    el.hide();

                if(state.imObj.prev != null)
                    state.prevButton.el.show();
            });
        }
    }

    /*
     * Image prototype
     */

    function Image(id) {
        this.id = id;
        this.image = null;
        this.prev = null;
        this.next = null;
        this.loaded = false;
        this.preloaded = false;
        this.visible = false;

        // Add thumbnail click event
        var imObj = this;
        $('li.snapbox-' + this.id).find('.' + pre.thumbID).click(function(){
            imObj.protoShow();
        });
    }

    // Show an image in the lightbox
    Image.prototype.protoShow = function(){
        var imObj = this;
        state.imObj = imObj;

        if(imObj.visible)
            return;

        if(imObj.loaded){
            imObj.image.show();

            if(!imObj.preloaded)
                imObj.preload();

            if(!state.lightbox.visible)
                state.lightbox.protoShow();
            return;
        }

        $.ajax({
            url: '/kv/wp-json/wp/v2/media/' + imObj.id,
            type: 'GET',
            success: function(data){
                state.imagebox.append('<img src="' + data.source_url + '" class="' + pre.imageID + imObj.id + '" />');
                imObj.image = $('img.' + pre.imageID + imObj.id);
                imObj.loaded = true;
                state.imObj = imObj;
                if(!state.lightbox.visible)
                    state.lightbox.protoShow();
                imObj.loaded = true;
                imObj.preload();
            }
        });
    };

    Image.prototype.preload = function() {
        var imObj = this;
        if(imObj.next && !imObj.next.loaded){
            $.ajax({
                url: '/kv/wp-json/wp/v2/media/' + imObj.next.id,
                type: 'GET',
                success: function(data){
                    var next = $(document.createElement('img')).attr('src', data.source_url).addClass(pre.imageID + imObj.next.id);
                    imObj.next.image = next;
                    next.hide();
                    state.imagebox.append(next);
                    imObj.next.loaded = true;
                }
            });
        }
        if(imObj.prev && !imObj.prev.loaded){
            $.ajax({
                url: '/kv/wp-json/wp/v2/media/' + imObj.prev.id,
                type: 'GET',
                success: function(data){
                    var prev = $(document.createElement('img')).attr('src', data.source_url).addClass(pre.imageID + imObj.prev.id);
                    imObj.prev.image = prev;
                    prev.hide();
                    state.imagebox.append(prev);
                    imObj.prev.loaded = true;
                }
            });
        }
        imObj.preloaded = true;
    }

    // Hide an image in the lightbox
    Image.prototype.protoHide = function(){
        this.image.hide();
    }

    // Set the array of gallery images
    function setImages(){
        var gallery = $('.snapbox-gallery-' + state.gal);
        var thumbs = $('.snapbox-gallery-' + state.gal + ' li');

        for(var n = 0; n < thumbs.length; n++){
            var thumb = $(thumbs[n]);
            var id = thumb.attr('data-snapbox-id');
            console.log(id);
            var image = new Image(id);
            pushImage(image);
        }
    }

    // Add an image to array of gallery images
    function pushImage(imObj){
        var key = pre.key + imObj.id;
        if(!images[key]){
            images[key] = imObj;

            if(state.lastPushed != null){
                state.lastPushed.next = imObj;
                imObj.prev = state.lastPushed;
            }
            state.lastPushed = imObj;
        }
    }

    /*
     * Close Button
     */

    state.closeButton.el.click(function(){
        state.lightbox.protoHide();
    });
});