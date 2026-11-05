import { NativeTabs } from "expo-router/native-tabs";

import { usePreferencias } from "@/contexto/preferencias";
import { COLORES } from "@/lib/colores";
import { texto } from "@/lib/textos";

/** Las tres pestañas de abajo, nativas en iPhone y en Android. */
export default function Pestanas() {
  const { idioma } = usePreferencias();
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
      <NativeTabs.Trigger name="cuenta">
        <NativeTabs.Trigger.Label>
          {texto(idioma, "cuenta")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
