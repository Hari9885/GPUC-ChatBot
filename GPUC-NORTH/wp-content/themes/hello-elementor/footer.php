<?php
/**
 * The template for displaying the footer.
 *
 * Contains the body & html closing tags.
 *
 * @package HelloElementor
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

if ( ! function_exists( 'elementor_theme_do_location' ) || ! elementor_theme_do_location( 'footer' ) ) {
	if ( hello_elementor_display_header_footer() ) {
		if ( did_action( 'elementor/loaded' ) && hello_header_footer_experiment_active() ) {
			get_template_part( 'template-parts/dynamic-footer' );
		} else {
			get_template_part( 'template-parts/footer' );
		}
	}
}
?>

<?php wp_footer(); ?>

<!-- Gopalan Pre-University College AI Admissions Chatbot (Bottom-Right Floating Widget) -->
<script>
  window.GPUC_CHATBOT_URL = window.GPUC_CHATBOT_URL || 'http://localhost:3000';
</script>
<script src="http://localhost:3000/gpuc-chatbot-embed.js" async></script>

</body>
</html>
