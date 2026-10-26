const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed MIME types and extensions (CSQP-F-003, CSQP-SR-004)
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];

// Max file size: 10 MB (10 * 1024 * 1024 bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        // Sanitize original file name
        const cleanBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${cleanBase}`);
    }
});

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

    if (isMimeAllowed && isExtAllowed) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type '${ext || file.mimetype}'. Only PDF, TXT, and Markdown files are permitted.`));
    }
}

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter
});

module.exports = {
    upload,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS
};
