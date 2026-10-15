<?php
define( 'WP_CACHE', true );


/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'gopalanpucnorth_gpucy' );

/** Database username */
define( 'DB_USER', 'gopalanpucnorth_gpucy' );

/** Database password */
define( 'DB_PASSWORD', 'flJm}Y@~m]9vu!#I' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'jp$zng+mRkNa3K$y+$%6~W3I|KA<eJvU^$nTLgY%^Kw75aGNs3&7qi4HA`f,4jR/' );
define( 'SECURE_AUTH_KEY',  '*ax>GwrHqMZLGR>&%Qc H~n{T*c2(/PFQIhBos17>Tu~p9Z#&x}r8.x>%at?ihf#' );
define( 'LOGGED_IN_KEY',    '21y =z_qFSKpnxb@<i6mEd}B0wnvW8RH9UPeP0{d4g:epi~ X:r|O0qwAn9-&{}t' );
define( 'NONCE_KEY',        'dhSiS_iowH_p);V0C</DjWa$4u;#E_Y>+AXif_#/} B?o7{|X38MwR^3Gx[ LY.U' );
define( 'AUTH_SALT',        'sngU*sW/)*xkKcXP4g 6}8iLMGSMA$_8y-,UgxdNjipnd)CRe~Xsgx!*aAY3KXL;' );
define( 'SECURE_AUTH_SALT', 'QG~_9>&pcWSuM=;n>>pQij/o@ZO?q T*hq1m15ccT?,eyvkhiQ 7MMDE3=?#iMlE' );
define( 'LOGGED_IN_SALT',   'x;m*N%t$m0W>+$#NrE)$jrJ;KhmmKSM%&Bo=1Eiz&;&~zhT3_(!73>>9oI*H}H+R' );
define( 'NONCE_SALT',       '7j~DGIEa@=2tPHm)MGBLGd5r$=.1MJfO}wK,|d~0CQ)1y/gqcRi=D)Ni0V@n_nx~' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
