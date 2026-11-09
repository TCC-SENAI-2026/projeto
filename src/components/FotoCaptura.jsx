import { useEffect, useRef, useState } from 'react';
import FotoColaborador from './FotoColaborador';
import { pararCamera, prepararFotoGaleria, comprimirFonteFoto } from '../utils/fotoCaptura.js';
import '../styles/FotoCaptura.css';

function FotoCaptura({ arquivo, fotoAtual, nome, onChange, onOcupado, disabled = false }) {
    const [preview, setPreview] = useState('');
    const [cameraAberta, setCameraAberta] = useState(false);
    const [stream, setStream] = useState(null);
    const [capturada, setCapturada] = useState(null);
    const [pronta, setPronta] = useState(false);
    const [processando, setProcessando] = useState(false);
    const [erro, setErro] = useState('');
    const video = useRef(null);
    const input = useRef(null);
    const streamAtual = useRef(null);
    const requisicao = useRef(0);
    const montado = useRef(true);

    useEffect(() => {
        montado.current = true;
        return () => {
            montado.current = false;
            requisicao.current += 1;
            pararCamera(streamAtual.current);
            streamAtual.current = null;
        };
    }, []);
    useEffect(() => {
        const foto = capturada || arquivo;
        if (!foto) { setPreview(''); return; }
        const url = URL.createObjectURL(foto);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [arquivo, capturada]);
    useEffect(() => { onOcupado?.(processando || cameraAberta); }, [processando, cameraAberta, onOcupado]);
    useEffect(() => {
        if (video.current && stream) video.current.srcObject = stream;
    }, [stream]);

    function desligar() {
        requisicao.current += 1;
        pararCamera(streamAtual.current);
        streamAtual.current = null;
        setStream(null);
        setPronta(false);
    }
    function fechar() {
        desligar();
        setCameraAberta(false);
        setCapturada(null);
    }
    async function abrirCamera() {
        setErro('');
        if (!navigator.mediaDevices?.getUserMedia) {
            setErro('Câmera indisponível. Use HTTPS ou localhost, ou escolha uma foto da galeria.');
            return;
        }
        desligar();
        setCapturada(null);
        setCameraAberta(true);
        const pedido = ++requisicao.current;
        try {
            const nova = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            if (!montado.current || pedido !== requisicao.current) { pararCamera(nova); return; }
            streamAtual.current = nova;
            setStream(nova);
        } catch (error) {
            if (!montado.current || pedido !== requisicao.current) return;
            setCameraAberta(false);
            setErro(error.name === 'NotAllowedError'
                ? 'Permissão da câmera negada. Você pode escolher uma foto da galeria.'
                : 'Não foi possível acessar a câmera. Verifique se ela está disponível ou use a galeria.');
        }
    }
    async function galeria(event) {
        const selecionado = event.target.files?.[0];
        event.target.value = '';
        if (!selecionado) return;
        setErro('');
        setProcessando(true);
        try {
            const foto = await prepararFotoGaleria(selecionado);
            if (montado.current) onChange(foto);
        } catch (error) { if (montado.current) setErro(error.message); }
        finally { if (montado.current) setProcessando(false); }
    }
    async function capturar() {
        if (!video.current || !pronta) return;
        setErro('');
        setProcessando(true);
        const pedido = requisicao.current;
        try {
            const foto = await comprimirFonteFoto(video.current, video.current.videoWidth, video.current.videoHeight);
            if (montado.current && pedido === requisicao.current) {
                setCapturada(foto);
                desligar();
            }
        } catch (error) { if (montado.current) setErro(error.message); }
        finally { if (montado.current) setProcessando(false); }
    }

    return (
        <div className="foto-captura">
            <FotoColaborador nome={nome} src={preview || fotoAtual} temFoto={false} />
            <div className="foto-captura-botoes">
                <button type="button" className="btn-page-sec" disabled={disabled || processando || cameraAberta}
                    onClick={() => input.current?.click()}>Escolher da galeria</button>
                <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={galeria} />
                <button type="button" className="btn-page-sec" disabled={disabled || processando || cameraAberta}
                    onClick={abrirCamera}>Tirar foto</button>
                {(arquivo || fotoAtual) && <button type="button" className="btn-page-sec"
                    disabled={disabled || processando || cameraAberta} onClick={() => onChange(null)}>Remover foto</button>}
            </div>
            {processando && <p role="status">Preparando foto...</p>}
            {erro && <p role="alert">{erro}</p>}
            {cameraAberta && (
                <div className="foto-captura-painel" role="dialog" aria-label="Tirar foto">
                    <h3>Câmera</h3>
                    {!capturada && <video ref={video} autoPlay playsInline muted onLoadedMetadata={() => setPronta(true)} />}
                    {capturada ? (
                        <div className="foto-captura-botoes">
                            <button type="button" className="btn-page-sec" disabled={processando} onClick={abrirCamera}>Refazer</button>
                            <button type="button" className="btn btn-add" disabled={processando} onClick={() => { onChange(capturada); fechar(); }}>Confirmar</button>
                        </div>
                    ) : <button type="button" className="btn btn-add" disabled={!pronta || processando} onClick={capturar}>Capturar</button>}
                    <button type="button" className="btn-page-sec" onClick={fechar}>Fechar câmera</button>
                </div>
            )}
        </div>
    );
}

export default FotoCaptura;
