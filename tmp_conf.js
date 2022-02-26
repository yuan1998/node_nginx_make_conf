const tmp = `server {
    listen 80;
    server_name *.$DOMAIN$ $DOMAIN$;
    return 301 https://$DOMAIN$$request_uri;
}

server {
    #listen 80;
    #listen [::]:80;

    # For https
    listen 443 ssl;
    #listen [::]:443 ssl ipv6only=on;
    ssl_certificate /var/www/node_make_nginx_conf/cert/$CRT$;
    ssl_certificate_key /var/www/node_make_nginx_conf/cert/$KEY$;

    server_name *.$DOMAIN$ $DOMAIN$;
    root /var/www/shop-q/public;
    index index.php index.html index.htm;

    location / {
         try_files $uri $uri/ /index.php$is_args$args;
    }

    location ~ \\.php$ {
        try_files $uri /index.php =404;
        fastcgi_pass php-upstream;
        fastcgi_index index.php;
        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        #fixes timeouts
        fastcgi_read_timeout 600;
        include fastcgi_params;
    }

    location ~ /\\.ht {
        deny all;
    }

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt/;
        log_not_found off;
    }

    error_log /var/log/nginx/laravel_error.log;
    access_log /var/log/nginx/laravel_access.log;
}`
export default tmp;