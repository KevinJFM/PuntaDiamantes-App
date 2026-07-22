import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../componentes/Logo';
import { solicitarPermisoPush } from '../servicios/notificaciones';
import { registrarToken } from '../servicios/api';

export default function PantallaBienvenida({ alContinuar }) {
  const margenes = useSafeAreaInsets();
  const [fase, setFase] = useState(null); // null | 'pregunta' | 'denegado'
  const [procesando, setProcesando] = useState(false);

  // "Continuar" ya no entra directo: primero ofrecemos activar las notificaciones (solo la 1ª vez)
  const alPresionarContinuar = () => setFase('pregunta');

  const activar = async () => {
    setProcesando(true);
    const push = await solicitarPermisoPush(); // aquí aparece el diálogo del sistema
    setProcesando(false);

    if (push.ok && push.token) {
      registrarToken(push.token).catch(() => {}); // guarda el token en el backend
      alContinuar();
    } else if (push.denegado) {
      setFase('denegado'); // el cliente tocó "No permitir": le explicamos cómo activarlo a mano
    } else {
      // Expo Go u otro caso sin token: no bloqueamos el ingreso
      alContinuar();
    }
  };

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.centro}>
        <View style={estilos.cajaLogo}>
          <Logo tamano={130} color="#E5388A" />
        </View>
        <Text style={estilos.titulo}>Te damos la bienvenida{'\n'}a Punta Diamantes 🎉</Text>
        <Text style={estilos.sub}>
          Consulta tus puntos, descubre tus recompensas y las promociones activas del hotel.
        </Text>
      </View>

      <Pressable style={[estilos.btn, { marginBottom: 16 + margenes.bottom }]} onPress={alPresionarContinuar}>
        <Text style={estilos.btnTxt}>Continuar</Text>
      </Pressable>

      {/* Diálogo de notificaciones (solo aparece en el primer ingreso) */}
      <Modal transparent visible={!!fase} animationType="fade" statusBarTranslucent>
        <View style={estilos.fondo}>
          <View style={estilos.cuadro}>
            {fase === 'pregunta' ? (
              <>
                <View style={[estilos.circulo, { backgroundColor: 'rgba(229,56,138,0.12)' }]}>
                  <Ionicons name="notifications" size={34} color="#E5388A" />
                </View>
                <Text style={estilos.cTitulo}>Activa tus notificaciones</Text>
                <Text style={estilos.cMensaje}>
                  Te avisaremos cuando haya nuevas promociones y cada vez que ganes o canjees puntos.
                </Text>

                <Pressable
                  style={[estilos.botonPrimario, procesando && { opacity: 0.7 }]}
                  onPress={activar}
                  disabled={procesando}
                >
                  {procesando
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={estilos.botonPrimarioTxt}>Activar</Text>}
                </Pressable>
                <Pressable style={estilos.botonSecundario} onPress={alContinuar} disabled={procesando}>
                  <Text style={estilos.botonSecundarioTxt}>Ahora no</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[estilos.circulo, { backgroundColor: 'rgba(107,114,128,0.14)' }]}>
                  <Ionicons name="notifications-off" size={34} color="#6b7280" />
                </View>
                <Text style={estilos.cTitulo}>Notificaciones desactivadas</Text>
                <Text style={estilos.cMensaje}>
                  No activaste los permisos. Si más adelante quieres recibir avisos de promociones y
                  puntos, actívalos manualmente en los ajustes de tu teléfono:
                </Text>
                <Text style={estilos.ruta}>Ajustes › Aplicaciones › Punta Diamantes › Notificaciones</Text>

                <Pressable style={estilos.botonPrimario} onPress={alContinuar}>
                  <Text style={estilos.botonPrimarioTxt}>Entendido</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#0A1259', paddingHorizontal: 26 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cajaLogo: { width: 130, height: 130, borderRadius: 30, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 26 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 34 },
  sub: { fontSize: 15, color: '#c9cef2', textAlign: 'center', marginTop: 14, lineHeight: 22 },
  btn: { backgroundColor: '#E5388A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Diálogo de notificaciones
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  cuadro: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center' },
  circulo: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  cTitulo: { fontSize: 18, fontWeight: '800', color: '#0A1259', textAlign: 'center' },
  cMensaje: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  ruta: { fontSize: 13, fontWeight: '700', color: '#0A1259', textAlign: 'center', marginTop: 12, lineHeight: 19 },
  botonPrimario: { marginTop: 20, alignSelf: 'stretch', backgroundColor: '#E5388A', borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  botonPrimarioTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  botonSecundario: { marginTop: 10, alignSelf: 'stretch', paddingVertical: 12, alignItems: 'center' },
  botonSecundarioTxt: { color: '#6b7280', fontSize: 14, fontWeight: '700' },
});
