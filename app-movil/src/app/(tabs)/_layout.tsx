import { NativeTabs } from "expo-router/native-tabs";

import { useCarrito } from "@/contexto/carrito";
import { usePreferencias } from "@/contexto/preferencias";
import { cuantos } from "@/lib/carrito";
import { COLORES } from "@/lib/colores";
import { texto } from "@/lib/textos";

/** Las tres pestañas de abajo, nativas en iPhone y en Android. */
export default function Pestanas() {
  const { idioma } = usePreferencias();
  const { lineas } = useCarrito();
  const enCarrito = cuantos(lineas);
  return (
    <NativeTabs tintColor={COLORES.naranja}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>
          {texto(idioma, "inicio")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="buscar" role="search">
        <NativeTabs.Trigger.Label>
          {texto(idioma, "buscar")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="carrito">
        <NativeTabs.Trigger.Label>
          {texto(idioma, "carrito")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart" md="shopping_cart" />
        {enCarrito > 0 ? (
          <NativeTabs.Trigger.Badge>
            {String(enCarrito)}
          </NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cuenta">
        <NativeTabs.Trigger.Label>
          {texto(idioma, "cuenta")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
