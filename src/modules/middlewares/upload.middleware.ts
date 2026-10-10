import { environment } from '../../config/environment';
import multer from "multer";
import path from "path";
import fs from "fs";

const storageDinamicoPorRuta = multer.diskStorage({
  destination: (req, file, cb) => {
    let carpeta = "generico"; // Default por si no matchea ninguna

    const ruta = req.originalUrl.toLowerCase();

    if (ruta.includes("/sucursales")) carpeta = "sucursales";
    else if (ruta.includes("/productos")) carpeta = "productos";

    const carpetaFinal = path.join(environment.uploadsDirectory, carpeta);
    if (!fs.existsSync(carpetaFinal)) fs.mkdirSync(carpetaFinal, { recursive: true });

    cb(null, carpetaFinal);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombre = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, nombre);
  }
});

export const uploadRutaDinamica = multer({
  storage: storageDinamicoPorRuta,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const tipos = ["image/jpeg", "image/png", "image/webp"];
    if (tipos.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Formato de imagen no permitido"));
  }
}).single("imagen"); // Ajusta el campo según sea necesario
