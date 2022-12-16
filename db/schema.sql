DROP DATABASE IF EXISTS recipe_db;
CREATE DATABASE recipe_db;
USE recipe_db;

DROP TABLE IF EXISTS recipes;
CREATE TABLE recipes (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    description VARCHAR(512),
    image VARCHAR(512),
    PRIMARY KEY (id)
);

DROP TABLE IF EXISTS ingredients;
CREATE TABLE ingredients (
    id INT NOT NULL AUTO_INCREMENT,
    description VARCHAR(255),
    recipe_id INT,
    PRIMARY KEY (id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS instructions;
CREATE TABLE instructions (
    id INT NOT NULL AUTO_INCREMENT,
    step INT NOT NULL,
    description VARCHAR(512),
    recipe_id INT,
    PRIMARY KEY (id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
