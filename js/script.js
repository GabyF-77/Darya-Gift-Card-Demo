document.addEventListener("DOMContentLoaded", () => {
    const tarjetaContainer = document.querySelector(".tarjeta-rascable");
    const canvas1 = document.getElementById("canvas-capa-1");
    const canvas2 = document.getElementById("canvas-capa-2");
    const ctx1 = canvas1.getContext("2d", { willReadFrequently: true });
    const ctx2 = canvas2.getContext("2d", { willReadFrequently: true });

    let capa1Completada = false;
    let capa2Completada = false;

    function dibujarEtiquetaCentral(ctx, w, h, texto, fondo, colorTexto, bordeColor = "rgba(255,255,255,0.22)") {
        if (!texto) return;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        const fontSize = Math.max(20, Math.min(32, Math.floor(w * 0.042)));
        ctx.font = `600 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const anchoTexto = ctx.measureText(texto).width;
        const boxW = anchoTexto + 48;
        const boxH = fontSize + 26;
        const x = (w - boxW) / 2;
        const y = (h - boxH) / 2;

        ctx.fillStyle = fondo;
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 16);
        ctx.fill();

        ctx.strokeStyle = bordeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = colorTexto;
        ctx.fillText(texto, w / 2, h / 2 + 1);
        ctx.restore();
    }

    function pintarCapaGeometrica() {
        const w = canvas1.width;
        const h = canvas1.height;
        ctx1.save();
        ctx1.globalCompositeOperation = "source-over";
        ctx1.clearRect(0, 0, w, h);

        const grad = ctx1.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "#2c4c7e");
        grad.addColorStop(1, "#4a73a8");
        ctx1.fillStyle = grad;
        ctx1.fillRect(0, 0, w, h);

        const step = 48;
        ctx1.strokeStyle = "rgba(255, 255, 255, 0.16)";
        ctx1.lineWidth = 1.5;

        for (let y = -step; y < h + step; y += step) {
            for (let x = -step; x < w + step; x += step) {
                const cx = x + step / 2;
                const cy = y + step / 2;
                const r = step * 0.42;

                ctx1.beginPath();
                ctx1.moveTo(cx, cy - r);
                ctx1.lineTo(cx + r, cy);
                ctx1.lineTo(cx, cy + r);
                ctx1.lineTo(cx - r, cy);
                ctx1.closePath();
                ctx1.stroke();
            }
        }

        const dotSpacing = 24;
        for (let y = 12; y < h; y += dotSpacing) {
            for (let x = 12; x < w; x += dotSpacing) {
                const alternado = ((Math.floor(x / dotSpacing) + Math.floor(y / dotSpacing)) % 2 === 0);
                ctx1.fillStyle = alternado ? "rgba(245, 176, 65, 0.8)" : "rgba(255, 248, 231, 0.6)";
                ctx1.beginPath();
                ctx1.arc(x, y, alternado ? 2.8 : 1.8, 0, Math.PI * 2);
                ctx1.fill();
            }
        }

        ctx1.restore();
        dibujarEtiquetaCentral(
            ctx1,
            w,
            h,
            "Сотри здесь...",
            "rgba(22, 36, 61, 0.80)",
            "#FFD166",
            "rgba(255, 209, 102, 0.45)"
        );
    }

    function pintarCapaBandera() {
        const w = canvas2.width;
        const h = canvas2.height;
        ctx2.save();
        ctx2.globalCompositeOperation = "source-over";
        ctx2.clearRect(0, 0, w, h);

        const franja = h / 3;

        ctx2.fillStyle = "#FFFFFF";
        ctx2.fillRect(0, 0, w, franja + 1);

        ctx2.fillStyle = "#0039A6";
        ctx2.fillRect(0, franja, w, franja + 1);

        ctx2.fillStyle = "#D52B1E";
        ctx2.fillRect(0, franja * 2, w, franja + 1);

        ctx2.restore();
        dibujarEtiquetaCentral(
            ctx2,
            w,
            h,
            "Сотри дальше...",
            "rgba(28, 24, 24, 0.78)",
            "#FFE5B4",
            "rgba(255, 229, 180, 0.45)"
        );
    }

    function ajustarTamaño() {
        if (!tarjetaContainer) return;
        const w = tarjetaContainer.offsetWidth;
        const h = tarjetaContainer.offsetHeight;

        if (!capa1Completada) {
            canvas1.width = w;
            canvas1.height = h;
            pintarCapaGeometrica();
        }
        if (!capa2Completada) {
            canvas2.width = w;
            canvas2.height = h;
            pintarCapaBandera();
        }
    }

    function obtenerPorcentajeRascado(ctx, w, h) {
        const data = ctx.getImageData(0, 0, w, h).data;
        let transparentes = 0;
        const paso = 32;
        let totalMuestreado = 0;

        for (let i = 3; i < data.length; i += paso) {
            totalMuestreado++;
            if (data[i] < 128) transparentes++;
        }
        return (transparentes / totalMuestreado) * 100;
    }

    function ocultarCanvas(canvas) {
        if (canvas.classList.contains("canvas-oculto")) return;
        canvas.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        canvas.style.opacity = "0";
        canvas.style.transform = "scale(1.04)";
        canvas.style.pointerEvents = "none";
        setTimeout(() => {
            canvas.classList.add("canvas-oculto");
        }, 600);
    }

    function configurarRascado(canvas, ctx, porcentajeMeta, alCompletar) {
        let isDrawing = false;
        let trazosDesdeUltimoChequeo = 0;
        let completado = false;

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const punto = e.touches ? e.touches[0] : e;
            return {
                x: punto.clientX - rect.left,
                y: punto.clientY - rect.top
            };
        }

        function start(e) {
            if (completado) return;
            isDrawing = true;
            const { x, y } = getPos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            move(e);
        }

        function stop() {
            if (!isDrawing) return;
            isDrawing = false;
            ctx.beginPath();
        }

        function move(e) {
            if (!isDrawing || completado) return;
            const { x, y } = getPos(e);

            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = Math.max(44, Math.min(62, canvas.width * 0.072));
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.restore();

            trazosDesdeUltimoChequeo++;
            if (trazosDesdeUltimoChequeo >= 10) {
                trazosDesdeUltimoChequeo = 0;
                const pct = obtenerPorcentajeRascado(ctx, canvas.width, canvas.height);
                if (pct >= porcentajeMeta) {
                    completado = true;
                    isDrawing = false;
                    ocultarCanvas(canvas);
                    alCompletar();
                }
            }
        }

        canvas.addEventListener("mousedown", start);
        canvas.addEventListener("mousemove", move);
        window.addEventListener("mouseup", stop);
        canvas.addEventListener("mouseleave", stop);

        canvas.addEventListener("touchstart", (e) => { e.preventDefault(); start(e); }, { passive: false });
        canvas.addEventListener("touchmove", (e) => { e.preventDefault(); move(e); }, { passive: false });
        canvas.addEventListener("touchend", stop);
    }

    window.addEventListener("resize", ajustarTamaño);
    ajustarTamaño();

    configurarRascado(canvas1, ctx1, 42, () => {
        capa1Completada = true;
    });

    configurarRascado(canvas2, ctx2, 42, () => {
        capa2Completada = true;
    });

    const sobre = document.getElementById("sobre-imagen");
    const notaFinal = document.getElementById("nota-final");
    const tituloPrincipal = document.querySelector(".titulo");

    function abrirCarta() {
        tarjetaContainer.style.display = "none";
        if (tituloPrincipal) tituloPrincipal.style.display = "none";
        notaFinal.classList.remove("nota-oculta");
        notaFinal.classList.add("nota-visible");
    }

    if (sobre && notaFinal && tarjetaContainer) {
        sobre.addEventListener("click", abrirCarta);
        sobre.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrirCarta();
            }
        });
    }

    const btnMusica = document.getElementById("btn-musica");
    const audioFondo = document.getElementById("audio-fondo");

    if (btnMusica && audioFondo) {
        audioFondo.volume = 0.35;

        btnMusica.addEventListener("click", async () => {
            try {
                if (audioFondo.paused) {
                    await audioFondo.play();
                    btnMusica.textContent = "❚❚ ♪ Molchat Doma — Клетка";
                } else {
                    audioFondo.pause();
                    btnMusica.textContent = "▶ ♪ Molchat Doma — Клетка";
                }
            } catch (err) {
                console.error("Error de audio:", err);
                btnMusica.textContent = "▶ ♪ Error al cargar audio";
            }
        });
    }
});