import { useState, useRef, useEffect, useCallback } from 'react';
import { secureApiCall } from '../../utils/authService';
import styles from './BarcodeScanner.module.css';

// Charge le polyfill dynamiquement uniquement quand nécessaire (évite de casser le bundle Safari)
let Detector = typeof window !== 'undefined' && 'BarcodeDetector' in window
  ? window.BarcodeDetector
  : null;

const hasCamera = typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia;

export default function BarcodeScanner({ isOpen, onClose, onProductFound }) {
  const [step, setStep] = useState('scan');
  const [product, setProduct] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const scannedRef = useRef(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const fetchProduct = useCallback(async (barcode) => {
    setStep('loading');
    try {
      const res = await secureApiCall(`/barcode/${barcode}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        setStep('result');
      } else {
        setErrorMsg(data.message);
        setStep('error');
      }
    } catch {
      setErrorMsg('Impossible de joindre le serveur. Vérifiez votre connexion.');
      setStep('error');
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!hasCamera) {
      setStep('manual');
      return;
    }
    setCameraError('');
    scannedRef.current = false;
    try {
      // Charger le polyfill si le natif n'est pas dispo
      if (!Detector) {
        try {
          const mod = await import('barcode-detector');
          Detector = mod.BarcodeDetector || mod.default;
        } catch {
          setCameraError('Impossible de charger le scanner.');
          setStep('manual');
          return;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new Detector({
        formats: ['ean_8', 'ean_13', 'upc_a', 'upc_e', 'code_128'],
      });

      const scan = async () => {
        if (scannedRef.current || !videoRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            scannedRef.current = true;
            stopCamera();
            fetchProduct(barcodes[0].rawValue);
            return;
          }
        } catch { /* frame pas encore prête */ }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Accès à la caméra refusé. Activez la permission caméra et réessayez.');
      } else {
        setCameraError("Impossible d'accéder à la caméra.");
      }
      setStep('manual');
    }
  }, [fetchProduct, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setStep('scan');
      setProduct(null);
      setErrorMsg('');
      setManualCode('');
      setCameraError('');
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const handleUseProduct = () => {
    if (product) {
      onProductFound(product);
      onClose();
    }
  };

  const handleRescan = () => {
    setProduct(null);
    setErrorMsg('');
    setStep('scan');
    startCamera();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (/^\d{8,14}$/.test(manualCode.trim())) {
      fetchProduct(manualCode.trim());
    }
  };

  // ── Photo recognition via Gemini Vision ──

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();
    recognizeFromImage(dataUrl);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => recognizeFromImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const recognizeFromImage = async (dataUrl) => {
    setPhotoPreview(dataUrl);
    setStep('loading');
    setErrorMsg('');
    try {
      const res = await secureApiCall('/nutrition/recognize', {
        method: 'POST',
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setProduct({ ...data.product, imageUrl: dataUrl });
        setStep('result');
      } else {
        setErrorMsg(data.error || 'Aliment non reconnu');
        setStep('error');
      }
    } catch {
      setErrorMsg('Impossible de joindre le serveur.');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.title}>Scanner un produit</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {/* Vue caméra */}
          {step === 'scan' && hasCamera && (
            <>
              <div className={styles.cameraWrapper}>
                <video ref={videoRef} className={styles.video} muted playsInline />
                <div className={styles.scanFrame}>
                  <div className={styles.corner} data-pos="tl" />
                  <div className={styles.corner} data-pos="tr" />
                  <div className={styles.corner} data-pos="bl" />
                  <div className={styles.corner} data-pos="br" />
                  <div className={styles.scanLine} />
                </div>
              </div>
              <p className={styles.hint}>Pointez vers un code-barres ou prenez une photo de l'aliment</p>
              <div className={styles.scanActions}>
                <button className={styles.photoBtn} onClick={captureFromCamera}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Prendre en photo
                </button>
                <button className={styles.linkBtn} onClick={() => { stopCamera(); setStep('manual'); }}>
                  Code manuel
                </button>
              </div>
            </>
          )}

          {/* Saisie manuelle + photo galerie */}
          {(step === 'manual' || (step === 'scan' && !hasCamera)) && (
            <div className={styles.manualForm}>
              {cameraError && <p className={styles.cameraError}>{cameraError}</p>}
              {!hasCamera && (
                <p className={styles.hint}>La caméra n'est pas disponible sur ce navigateur.</p>
              )}

              {/* Photo recognition */}
              <button
                type="button"
                className={styles.photoUploadBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Reconnaître un aliment par photo</span>
                <span className={styles.photoUploadHint}>Tomate, poulet, riz...</span>
              </button>

              <div className={styles.orDivider}><span>ou</span></div>

              <form onSubmit={handleManualSubmit}>
                <label className={styles.label}>Code-barres (EAN-13 / EAN-8)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex : 3017620422003"
                  maxLength={14}
                  autoFocus
                />
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={!/^\d{8,14}$/.test(manualCode)}
                >
                  Rechercher
                </button>
              </form>
              {hasCamera && (
                <button type="button" className={styles.linkBtn} onClick={handleRescan}>
                  ← Revenir à la caméra
                </button>
              )}
            </div>
          )}

          {/* Hidden file input for photo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Chargement */}
          {step === 'loading' && (
            <div className={styles.centered}>
              <div className={styles.spinner} />
              <p className={styles.hint}>Recherche du produit…</p>
            </div>
          )}

          {/* Erreur */}
          {step === 'error' && (
            <div className={styles.centered}>
              <div className={styles.errorIcon}>✕</div>
              <p className={styles.errorText}>{errorMsg}</p>
              <button className={styles.primaryBtn} onClick={handleRescan}>Réessayer</button>
              <button className={styles.linkBtn} onClick={() => setStep('manual')}>Saisir le code manuellement</button>
            </div>
          )}

          {/* Résultat */}
          {step === 'result' && product && (
            <div className={styles.result}>
              <div className={styles.productHeader}>
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} className={styles.productImg} />
                )}
                <div>
                  <p className={styles.productName}>{product.name || 'Produit sans nom'}</p>
                  {product.brand && <p className={styles.productBrand}>{product.brand}</p>}
                  {product.quantity && <p className={styles.productQty}>{product.quantity}</p>}
                </div>
              </div>

              {product.source === 'gemini-vision' && (
                <p className={styles.aiLabel}>Reconnu par IA — valeurs estimées</p>
              )}
              <p className={styles.perLabel}>Valeurs nutritionnelles pour 100g</p>
              <div className={styles.macrosGrid}>
                <div className={styles.macroItem}>
                  <span className={styles.macroValue}>{product.nutrition.calories}</span>
                  <span className={styles.macroLabel}>kcal</span>
                </div>
                <div className={styles.macroItem}>
                  <span className={styles.macroValue}>{product.nutrition.proteins}g</span>
                  <span className={styles.macroLabel}>Protéines</span>
                </div>
                <div className={styles.macroItem}>
                  <span className={styles.macroValue}>{product.nutrition.carbs}g</span>
                  <span className={styles.macroLabel}>Glucides</span>
                </div>
                <div className={styles.macroItem}>
                  <span className={styles.macroValue}>{product.nutrition.fats}g</span>
                  <span className={styles.macroLabel}>Lipides</span>
                </div>
                {product.nutrition.fiber > 0 && (
                  <div className={styles.macroItem}>
                    <span className={styles.macroValue}>{product.nutrition.fiber}g</span>
                    <span className={styles.macroLabel}>Fibres</span>
                  </div>
                )}
              </div>

              <div className={styles.resultActions}>
                <button className={styles.primaryBtn} onClick={handleUseProduct}>
                  Utiliser ce produit
                </button>
                <button className={styles.secondaryBtn} onClick={handleRescan}>
                  Rescanner
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
