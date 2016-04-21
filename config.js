var config = {};
config.HTTP_port = 3001;
config.HTTPS_port = null;
config.HTTPS = false;
config.env = "DEV";

// No Mr. Hacker, this secret key is not the same one as the production key. But
// I really respect the efforts.
config.session_key = "h0!9&nc7clz_6idaa!k0^9-gt4+!x9gi!o7_l_v-=fca9lh16c";

module.exports = config;
