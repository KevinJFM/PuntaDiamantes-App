import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { borrarToken, cerrarSesionPortal, registrarToken } from '../servicios/api';
import { solicitarPermisoPush, tienePermisoPush, pushDesactivadoPorUsuario, marcarPushDesactivado } from '../servicios/notificaciones';
import { usarAvisos } from '../componentes/Avisos';
import { usarTema } from '../tema/tema';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function PantallaConfiguracion({ alCerrarSesion }) {
  const { colores, oscuro, alternarTema } = usarTema();
  const mostrarAviso = usarAvisos();
  const estilos = crearEstilos(colores);
  const [cerrando, setCerrando] = useState(false);
  const [cerrandoPortal, setCerrandoPortal] = useState(false);
  const [enLinea, setEnLinea] = useState(true);
  const [notifActivas, setNotifActivas] = useState(false);
  const [cargandoNotif, setCargandoNotif] = useState(true); // true al inicio mientras se consulta el permiso

  // Vigila la conexión en vivo: si no hay internet, se deshabilita el botón de cerrar sesión.
  useEffect(() => {
    const quitar = NetInfo.addEventListener((estado) => {
      setEnLinea(estado.isConnected !== false); // false solo cuando de verdad no hay red
    });
    return () => quitar();
  }, []);

  // Estado inicial del interruptor: activo solo si hay permiso del sistema Y el cliente no lo apagó a mano.
  useEffect(() => {
    (async () => {
      const [permiso, apagado] = await Promise.all([tienePermisoPush(), pushDesactivadoPorUsuario()]);
      setNotifActivas(permiso && !apagado);
      setCargandoNotif(false);
    })();
  }, []);

  // Enciende o apaga las notificaciones desde la app (sin tener que cerrar sesión).
  const alternarNotif = async () => {
    setCargandoNotif(true);
    try {
      if (notifActivas) {
        // Apagar: recordamos la preferencia y borramos el token en el backend para que dejen de enviarse.
        await marcarPushDesactivado(true);
        try { await borrarToken(); } catch { /* sin internet: al menos la preferencia local ya evita el reenvío */ }
        setNotifActivas(false);
        mostrarAviso('info', 'Notificaciones desactivadas', 'Ya no recibirás avisos en este teléfono. Puedes volver a activarlas cuando quieras.');
      } else {
        // Encender: pedimos el permiso (si hace falta) y registramos el token.
        const push = await solicitarPermisoPush();
        if (push.ok && push.token) {
          try { await registrarToken(push.token); } catch { /* se reintenta al abrir la app / iniciar sesión */ }
          setNotifActivas(true);
          mostrarAviso('exito', 'Notificaciones activadas', 'Te avisaremos de nuevas promociones y cada vez que ganes o canjees puntos.');
        } else if (push.denegado) {
          // El permiso está bloqueado a nivel del sistema: el diálogo ya no aparece, hay que abrirlo en Ajustes.
          mostrarAviso('info', 'Actívalas en Ajustes', 'El permiso está bloqueado en el teléfono. Ábrelo en Ajustes › Aplicaciones › Punta Diamantes › Notificaciones.');
          Linking.openSettings().catch(() => {});
        } else {
          mostrarAviso('error', 'No disponible', push.motivo || 'Las notificaciones solo funcionan en un teléfono real con la app instalada.');
        }
      }
    } finally {
      setCargandoNotif(false);
    }
  };

  // Cierra de forma remota la sesión del PORTAL web (por si la dejaste abierta en otra compu)
  const cerrarPortal = async () => {
    setCerrandoPortal(true);
    try {
      const r = await cerrarSesionPortal();
      mostrarAviso('info', r.cerrada ? 'Sesión del portal cerrada' : 'Sin sesión del portal', r.message);
    } catch (e) {
      mostrarAviso(
        'error',
        'No se pudo',
        e?.response ? (e.response.data?.message || 'Inténtalo de nuevo.') : 'Necesitas internet para hacer esto.'
      );
    } finally {
      setCerrandoPortal(false);
    }
  };

  const salir = async () => {
    setCerrando(true);
    const inicio = Date.now();
    // Cerrar sesión requiere internet (reingresar pide código nuevo); borrarToken confirma de paso que hay conexión.
    try {
      await borrarToken(); // limpia el push_token en el backend
    } catch (e) {
      if (!e?.response) {
        // Sin respuesta del servidor = sin internet → no cerramos sesión
        setCerrando(false);
        return mostrarAviso(
          'error',
          'Sin conexión',
          'Necesitas internet para cerrar sesión, porque deberás ingresar de nuevo con un código.'
        );
      }
      // Hubo respuesta (p. ej. la sesión ya venció): el servidor está accesible, seguimos.
    }
    await SecureStore.deleteItemAsync('portal_token');
    // Mínimo ~1s para que se note el "Cerrando sesión…"
    const restante = Math.max(0, 1000 - (Date.now() - inicio));
    setTimeout(() => alCerrarSesion(), restante);
  };

  return (
    <View style={estilos.pantalla}>
      {/* Capa "Cerrando sesión…" mientras se cierra la sesión */}
      <Modal transparent visible={cerrando} animationType="fade" statusBarTranslucent>
        <View style={[estilos.overlayCerrando, { backgroundColor: oscuro ? 'rgba(11,16,32,0.95)' : 'rgba(255,255,255,0.96)' }]}>
          <ActivityIndicator size="large" color={colores.rosa} />
          <Text style={estilos.cerrandoTxt}>Cerrando sesión…</Text>
        </View>
      </Modal>

      <Text style={estilos.titulo}>Configuración</Text>

      {/* Modo claro / oscuro */}
      <View style={estilos.tarjeta}>
        <View style={estilos.fila}>
          <View style={estilos.filaIzq}>
            <Ionicons name={oscuro ? 'moon' : 'sunny'} size={22} color={colores.rosa} />
            <Text style={estilos.filaTxt}>{oscuro ? 'Modo oscuro' : 'Modo claro'}</Text>
          </View>

          {/* Interruptor sol/luna */}
          <Pressable onPress={alternarTema} style={[estilos.interruptor, oscuro && estilos.interruptorEncendido]}>
            <View style={[estilos.perilla, oscuro && estilos.perillaEncendida]}>
              <Ionicons name={oscuro ? 'moon' : 'sunny'} size={14} color={oscuro ? colores.azul : '#f5a623'} />
            </View>
          </Pressable>
        </View>
        <Text style={estilos.ayuda}>Cambia entre tema claro y oscuro.</Text>
      </View>

      {/* Notificaciones: activar/desactivar los avisos push sin cerrar sesión */}
      <View style={estilos.tarjeta}>
        <View style={estilos.fila}>
          <View style={estilos.filaIzq}>
            <Ionicons name={notifActivas ? 'notifications' : 'notifications-off'} size={22} color={colores.rosa} />
            <Text style={estilos.filaTxt}>Notificaciones</Text>
          </View>

          {cargandoNotif ? (
            <ActivityIndicator size="small" color={colores.rosa} style={estilos.notifCargando} />
          ) : (
            <Pressable onPress={alternarNotif} style={[estilos.interruptor, notifActivas && estilos.interruptorEncendido]}>
              <View style={[estilos.perilla, notifActivas && estilos.perillaEncendida]}>
                <Ionicons
                  name={notifActivas ? 'notifications' : 'notifications-off'}
                  size={14}
                  color={notifActivas ? colores.azul : colores.tenue}
                />
              </View>
            </Pressable>
          )}
        </View>
        <Text style={estilos.ayuda}>
          Recibe avisos de nuevas promociones y cada vez que ganes o canjees puntos.
        </Text>
      </View>

      {/* Seguridad: cerrar la sesión del portal web de forma remota */}
      <View style={estilos.tarjeta}>
        <View style={estilos.filaIzq}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colores.rosa} />
          <Text style={estilos.filaTxt}>Seguridad</Text>
        </View>
        <Text style={estilos.ayuda}>
          ¿Dejaste el portal web abierto en otra computadora? Ciérralo desde aquí.
        </Text>
        <Pressable
          style={[estilos.btnPortal, !enLinea && estilos.btnPortalDeshab]}
          onPress={cerrarPortal}
          disabled={!enLinea || cerrandoPortal}
        >
          {cerrandoPortal
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="desktop-outline" size={18} color={enLinea ? '#fff' : colores.tenue} />}
          <Text style={[estilos.btnPortalTxt, !enLinea && { color: colores.tenue }]}>
            Cerrar sesión del portal
          </Text>
        </Pressable>
      </View>

      {/* Cerrar sesión */}
      <View style={estilos.salirInfo}>
        <Text style={estilos.salirInfo1}>Presiona el botón</Text>
        <Text style={estilos.salirInfo2}>Deberás ingresar tus datos de nuevo</Text>
      </View>
      <Pressable
        style={[estilos.btnSalir, !enLinea && estilos.btnSalirDeshab]}
        onPress={salir}
        disabled={!enLinea}
      >
        <Ionicons name="log-out-outline" size={20} color={enLinea ? '#fff' : colores.tenue} />
        <Text style={[estilos.btnSalirTxt, !enLinea && { color: colores.tenue }]}>Cerrar sesión</Text>
      </Pressable>
      {!enLinea && (
        <Text style={estilos.salirOffline}>Sin conexión: necesitas internet para cerrar sesión.</Text>
      )}

      <View style={estilos.cajaPie}>
        <Text style={estilos.pie}>Punta Diamantes · Fidelización de Clientes</Text>
        <Text style={estilos.version}>Versión {VERSION}</Text>
      </View>
    </View>
  );
}

const crearEstilos = (c) => StyleSheet.create({
  overlayCerrando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  cerrandoTxt: { color: c.texto, fontSize: 16, fontWeight: '700' },
  pantalla: { flex: 1, backgroundColor: c.fondo, padding: 16 },
  titulo: { fontSize: 20, fontWeight: '800', color: c.texto, marginBottom: 16, marginTop: 4 },

  tarjeta: { backgroundColor: c.tarjeta, borderWidth: 1.5, borderColor: c.borde, borderRadius: 16, padding: 16, marginBottom: 18 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaIzq: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaTxt: { fontSize: 16, fontWeight: '700', color: c.texto },
  ayuda: { fontSize: 12, color: c.tenue, marginTop: 8 },

  interruptor: { width: 56, height: 32, borderRadius: 20, backgroundColor: c.ficha, padding: 3, justifyContent: 'center' },
  interruptorEncendido: { backgroundColor: c.azul },
  perilla: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  perillaEncendida: { alignSelf: 'flex-end' },
  notifCargando: { width: 56, alignItems: 'center' },

  btnPortal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, backgroundColor: c.rosa, borderRadius: 14, paddingVertical: 15 },
  btnPortalDeshab: { backgroundColor: c.ficha },
  btnPortalTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  salirInfo: { alignItems: 'center', marginBottom: 10 },
  salirInfo1: { fontSize: 14, fontWeight: '700', color: c.texto },
  salirInfo2: { fontSize: 12, color: c.tenue, marginTop: 2 },
  btnSalir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.rosa, borderRadius: 14, paddingVertical: 15 },
  btnSalirDeshab: { backgroundColor: c.ficha },
  btnSalirTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  salirOffline: { textAlign: 'center', fontSize: 12.5, color: c.tenue, marginTop: 10 },

  cajaPie: { marginTop: 'auto', paddingBottom: 8 },
  pie: { textAlign: 'center', fontSize: 12, color: c.tenue },
  version: { textAlign: 'center', fontSize: 12, color: c.tenue, marginTop: 3 },
});
