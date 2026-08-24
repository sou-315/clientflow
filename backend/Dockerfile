FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .

# Render sets $PORT automatically; default to 10000 for local docker testing
CMD ["sh", "-c", "php -d display_errors=1 -d error_reporting=E_ALL -S 0.0.0.0:${PORT:-10000} -t public"]
