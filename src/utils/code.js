const { customAlphabet } = require('nanoid');

// Bỏ các ký tự dễ gây nhầm lẫn khi đọc/gõ tay: 0/O, 1/I/l
const ALPHABET = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

const length = Number(process.env.CODE_LENGTH) || 6;
const generate = customAlphabet(ALPHABET, length);

// Mã người dùng tự đặt (custom alias) chỉ cho phép chữ, số, gạch ngang, gạch dưới
const CUSTOM_CODE_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

module.exports = {
  generateCode: generate,
  isValidCustomCode: (code) => CUSTOM_CODE_REGEX.test(code),
};
