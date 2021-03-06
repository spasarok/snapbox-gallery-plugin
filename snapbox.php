<?php

/*
 * Plugin Name: Snapbox Gallery Plugin
 * Author: Kim Spasaro
 * Version: 0.0.1
 */

/**/

function snapbox_register_scripts(){
    wp_register_style('snapbox', plugin_dir_url( __FILE__ ) . 'snapbox.css');
    wp_register_script('snapbox', plugin_dir_url( __FILE__ ) . 'snapbox.js');
}
add_action('wp_enqueue_scripts', 'snapbox_register_scripts');

function snapbox($atts) {
    $gallery_id = $atts['id'];
    if(!$gallery_id){$gallery_id = rand(0, 999999);};
    $ids = explode(',', $atts['ids']);
    $atts['size'] ? $size = $atts['size'] : $size = 'thumbnail';
    $atts['columns'] ? $cols = $atts['columns'] : $cols = 3;
    $col = 0;
    $to_js = array('gallery' => $gallery_id);

    wp_enqueue_script('jquery');
    wp_enqueue_style('snapbox');
    wp_enqueue_script('snapbox');
    wp_localize_script('snapbox', 'snapvals', $to_js);

    ob_start(); ?>
    <div class="snapbox-wrapper"><ul class="snapbox-gallery snapbox-gallery-<?php echo $gallery_id; ?>">

    <?php if($cols > 0 ){
        foreach($ids as $id){
            echo '<li data-snapbox-id="' . $id . '" class="snapbox-' . $id . '">' . wp_get_attachment_image($id, $size, $icon = null, array('class' => 'attachment-thumbnail', 'data-snapbox-id' => $id)) . '</li>';
            if($col == $cols - 1):
                $col = 0;
                echo '<br />';
            else:
                $col++;
            endif;
        }
    }
    else{
        foreach($ids as $id){
            echo '<li data-snapbox-id="' . $id . '" class="snapbox-' . $id . '">' . wp_get_attachment_image($id, $size, $icon = null, array('class' => 'attachment-thumbnail', 'data-snapbox-id' => $id)) . '</li>';
        }
    } ?>
    </ul></div>

    <?php return ob_get_clean();
}
remove_shortcode('gallery', 'gallery_shortcode');
add_shortcode('gallery', 'snapbox');

// Create custom plugin settings menu
function snapbox_create_menu() {
    add_submenu_page(
        'options-general.php',
        'Snapbox',
        'Snapbox',
        'editor',
        'snapbox_options_page',
        'snapbox_options_page'
    );
    add_action( 'admin_init', 'snapbox_register_options' );
}
add_action('admin_menu', 'snapbox_create_menu');

// Register settings
function snapbox_register_options() {
    register_setting( 'snapbox_options_group', 'snapbox_port' );
    register_setting( 'snapbox_options_group', 'snapbox_path' );
}

// Create options page
function snapbox_options_page() {
    ?>
    <div class="wrap">
        <h2>Snapbox Options</h2>

        <form method="post" action="options.php">
            <?php settings_fields( 'snapbox_options_group' ); ?>
            <?php do_settings_sections( 'snapbox_options_group' ); ?>

            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Port</th>
                    <td><input type="text" class="large-text" name="snapbox_port" value="<?php echo esc_attr( get_option('snapbox_port') ); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">WordPress Path</th>
                    <td><input type="text" class="large-text" name="snapbox_path" value="<?php echo esc_attr( get_option('snapbox_path') ); ?>" /></td>
                </tr>
            </table>

            <?php submit_button(); ?>
        </form>
    </div>
<?php }