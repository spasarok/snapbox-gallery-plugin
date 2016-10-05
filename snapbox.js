jQuery(document).ready( function($) {

    var host = 'http://' + window.location.hostname + ':8888/kv';
    var galleryID = snapvals.gallery;

   /*
    * Class prefixes and constants
    */
    var pre =  {
        thumbID: 'attachment-thumbnail',
        key: 'obj-',
        imageID: 'snapbox-img-',
        next: 'next',
        prev: 'prev',
        lightbox: 'light'
    };

    /*
     * Gallery prototype
     * Create view for specified gallery element
     */

    function Gallery(gallery) {
        this.gallery = gallery;
        this.galleryID = Math.floor(Math.random() * 100000);
        this.gallery.addClass('snapbox-gallery-' + this.galleryID);
        this.state = null;
        this.view = new View(this);
    }

    /*
     * View Prototype
     * Keeps track of lightbox elements
     */

    function View(gallery) {

        // Set lightbox values
        this.gallery = gallery;
        this.el = $(document.createElement('div')).addClass('snapbox-lightbox').addClass('snapbox-lightbox-' + this.gallery.galleryID);
        this.nextButton = $(document.createElement('div')).addClass('snapbox-control-toggle-next');
        this.prevButton = $(document.createElement('div')).addClass('snapbox-control-toggle-prev');
        this.closeButton = $(document.createElement('div')).addClass('snapbox-control-close');
        this.imagebox = $(document.createElement('div')).addClass('snapbox-imagebox');
        this.imObj = {}; // Image object currently being viewed
        this.visible = false;

        // Scope variables
        this.gallery.state = new State(this.gallery);
        var state = this.gallery.state;
        var ctrl = this.gallery;
        var view = this;
        var el = this.el;
        var nextButton = this.nextButton;
        var prevButton = this.prevButton;
        var closeButton = this.closeButton;
        var imagebox = this.imagebox;
        var imObj = this.imObj;
        var visible = this.visible;

        // Build lightbox
        $('body').append(this.el);
        el.append(this.imagebox);
        imagebox.append(this.nextButton);
        imagebox.append(this.prevButton);
        imagebox.append(this.closeButton);

       /*
        * View Functions
        */

        // Hide lightbox
        this.hideLightbox = function(){
            el.hide();
            visible = false;
            this.hideImage();
        }

        // Hide lightbox image
        this.hideImage = function(){
            // Make sure image has loaded
            if(imObj.image == null){
                this.hideImage();
            }

            imObj.image.hide();
        }

        // Show lightbox
        this.showLightbox = function(newIm){
            imObj = newIm;

            if(imObj.next == null)
                nextButton.hide();
            else
                nextButton.show();

            if(imObj.prev == null)
                prevButton.hide();
            else
                prevButton.show();

            this.showImage();
            el.show();
        }

        // Show lightbox image
        this.showImage = function(){
            var view = this;

            // If we've already made an ajax call for this image...
            if(imObj.loaded){
                // Make sure image is done loading
                if(imObj.image == null){
                    this.showImage();
                }
                imObj.image.show();

                // Preload previous and next images
                if(!imObj.preloaded)
                    imObj.preload();

                return;
            }

            // If we haven't made an ajax call for this image...
            $.ajax({
                url: '/kv/wp-json/wp/v2/media/' + imObj.id,
                type: 'GET',
                success: function(data){
                    imagebox.append('<img src="' + data.source_url + '" class="' + pre.imageID + imObj.id + '" />');
                    imObj.image = $('img.' + pre.imageID + imObj.id);
                    imObj.loaded = true;
                    imObj.image.show();
                    imObj.preload();
                },
                error: function(data){
                    view.hideLightbox();
                }
            });
        };


        /*
         * Click events
         */

        // Click event for previous button
        prevButton.click(function(){
            view.hideImage();
            imObj = imObj.prev;
            view.showImage();

            if(imObj.prev == null)
                prevButton.hide();

            if(imObj.next != null)
                nextButton.show();
        });

        // Click event for next button
        nextButton.click(function(){
            view.hideImage();
            imObj = imObj.next;
            view.showImage();

            if(imObj.next == null)
                nextButton.hide();

            if(imObj.prev != null)
                prevButton.show();
        });

        // Click event for close button
        closeButton.click(function(){
            view.hideLightbox();
        });
    }

    /*
     * Image prototype
     * Stores gallery image data
     */

    function Image(imageID, gallery) {
        // Set values
        this.id = imageID;
        this.image = null;
        this.prev = null;
        this.next = null;
        this.loaded = false;
        this.preloaded = false;
        this.gallery = gallery;

        // Scope variables
        var imObj = this;
        var gallery = this.gallery;

        // Add thumbnail click event
        gallery.gallery.find('li.snapbox-' + imageID + ' .' + pre.thumbID).click(function(){
            gallery.view.showLightbox(imObj);
        });

        this.preload = function() {
            var view = gallery.view;

            if(imObj.next != null && !imObj.next.loaded){
                imObj.next.loaded = true;

                $.ajax({
                    url: '/kv/wp-json/wp/v2/media/' + imObj.next.id,
                    type: 'GET',
                    success: function(data){
                        var next = $(document.createElement('img')).attr('src', data.source_url).addClass(pre.imageID + imObj.next.id);
                        imObj.next.image = next;
                        next.hide();
                        view.imagebox.append(next);
                    },
                    error: function(data){
                        var next = $(document.createElement('img')).attr('src', data.source_url).addClass(pre.imageID + imObj.next.id);
                        imObj.next.image = next;
                        next.hide();
                        view.imagebox.append(next);
                    }
                });
            }

            if(imObj.prev != null && !imObj.prev.loaded){
                imObj.prev.loaded = true;

                $.ajax({
                    url: '/kv/wp-json/wp/v2/media/' + imObj.prev.id,
                    type: 'GET',
                    success: function(data){
                        var prev = $(document.createElement('img')).attr('src', data.source_url).addClass(pre.imageID + imObj.prev.id);
                        imObj.prev.image = prev;
                        prev.hide();
                        view.imagebox.append(prev);
                    },
                    error: function(data){
                        var next = $(document.createElement('img')).attr('src', data.source_url).addClass(pre.imageID + imObj.next.id);
                        imObj.next.image = next;
                        next.hide();
                        view.imagebox.append(next);
                    }
                });
            }

            imObj.preloaded = true;
        };
    }

    /*
     * State Prototype
     * Stores lightbox state data
     */

    function State(gallery) {
        this.gallery = gallery;
        this.images = {};
        this.lastPushed = null;   // Last image pushed to the image array
        this.first = null;        // True if at the first image
        this.last = null;       // True if at the last image

        /*
         * State Functions
         */

        // Set the array of lightbox images
        this.setImages = function(){
            var gallery = this.gallery.gallery;
            var thumbs = gallery.find('li');

            for(var n = 0; n < thumbs.length; n++){
                var thumb = $(thumbs[n]);
                var imageID = thumb.attr('data-snapbox-id');
                var image = new Image(imageID, this.gallery);
                this.pushImage(image);
            }
        };

        // Set one image in array of lightbox images
        this.pushImage = function(imObj){
            var key = pre.key + imObj.id;

            if(!this.images[key]){
                this.images[key] = imObj;

                if(this.lastPushed != null){
                    this.lastPushed.next = imObj;
                    imObj.prev = this.lastPushed;
                }
                this.lastPushed = imObj;
            }
        }

        this.setImages();
    };

    // Main method
    function main(){
        var galleries = $('.snapbox-gallery');
        for(var i = 0; i < galleries.length; i++){
            new Gallery($(galleries[i]));
        }
    }

    main();
});