FROM php:8.3-fpm-alpine AS base

# Install system dependencies & PostgreSQL / BCMath libs
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    curl \
    git \
    supervisor \
    linux-headers

# Install required PHP extensions for financial GST calculation & PostgreSQL
RUN docker-php-ext-install \
    bcmath \
    pdo_pgsql \
    pgsql \
    pcntl \
    opcache

# Install Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application files
COPY . .

# Set up storage and cache permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Production optimized PHP configuration
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

EXPOSE 9000

CMD ["php-fpm"]
