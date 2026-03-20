const express = require('express');

module.exports = (req, res, next) => {
    express.json()(req, res, next);
};
