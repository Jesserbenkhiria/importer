import React, { useState } from "react";
import {
  Card,
  Checkbox,
  TextField,
  Stack,
  RadioButton,
  ButtonGroup,
  Button,
} from "@shopify/polaris";

const GeneralSection = () => {
  const [importActive, setImportActive] = useState(true);
  const [importFrequency, setImportFrequency] = useState(60);
  const [stateConditions, setStateConditions] = useState({
    km0: true,
    likeNew: true,
    excellent: true,
    good: true,
    medium: true,
  });
  const [glassConditions, setGlassConditions] = useState({
    noSigns: true,
    minorSigns: true,
    visibleSigns: true,
    normalSigns: false,
  });
  const [batteryState, setBatteryState] = useState({
    new: true,
    optimal: true,
    replace: true,
    percentage: false,
  });
  const [batteryPercentage, setBatteryPercentage] = useState(75);
  const [anomalies, setAnomalies] = useState("qualsiasi");

  const handleStateConditionChange = (condition) => {
    setStateConditions((prev) => ({ ...prev, [condition]: !prev[condition] }));
  };

  const handleGlassConditionChange = (condition) => {
    setGlassConditions((prev) => ({ ...prev, [condition]: !prev[condition] }));
  };

  const handleBatteryStateChange = (state) => {
    setBatteryState((prev) => ({ ...prev, [state]: !prev[state] }));
  };

  return (
    <Card title="Generali" sectioned>
      <Stack vertical spacing="loose">
        <Checkbox
          label="Import attiva?"
          checked={importActive}
          onChange={(newValue) => setImportActive(newValue)}
        />
        <TextField
          label="Frequenza importazione (minuti)"
          type="number"
          value={importFrequency.toString()}
          onChange={(value) => setImportFrequency(Number(value))}
        />

        <Stack vertical spacing="tight">
          <p>Stato estetico:</p>
          <Stack spacing="tight">
            {["km0", "likeNew", "excellent", "good", "medium"].map((key, index) => (
              <Checkbox
                key={index}
                label={
                  {
                    km0: "KM 0",
                    likeNew: "pari al nuovo",
                    excellent: "ottimo",
                    good: "buono",
                    medium: "medio",
                  }[key]
                }
                checked={stateConditions[key]}
                onChange={() => handleStateConditionChange(key)}
              />
            ))}
          </Stack>
        </Stack>

        <Stack vertical spacing="tight">
          <p>Condizione vetro:</p>
          <Stack spacing="tight">
            {["noSigns", "minorSigns", "visibleSigns", "normalSigns"].map((key, index) => (
              <Checkbox
                key={index}
                label={
                  {
                    noSigns: "Privo di segni sul vetro",
                    minorSigns: "Piccoli segni in controluce sul vetro",
                    visibleSigns: "Visibili segni sul vetro",
                    normalSigns: "Normali segni sul vetro",
                  }[key]
                }
                checked={glassConditions[key]}
                onChange={() => handleGlassConditionChange(key)}
              />
            ))}
          </Stack>
        </Stack>

        <Stack vertical spacing="tight">
          <p>Stato batteria:</p>
          <Stack spacing="tight">
            {["new", "optimal", "replace", "percentage"].map((key, index) => (
              <Checkbox
                key={index}
                label={
                  {
                    new: "nuova",
                    optimal: "ottimale",
                    replace: "da sostituire",
                    percentage: "percentuale",
                  }[key]
                }
                checked={batteryState[key]}
                onChange={() => handleBatteryStateChange(key)}
              />
            ))}
          </Stack>
          {batteryState.percentage && (
            <TextField
              type="number"
              value={batteryPercentage.toString()}
              suffix="%"
              onChange={(value) => setBatteryPercentage(Number(value))}
            />
          )}
        </Stack>

        <Stack vertical spacing="tight">
          <p>Anomalie:</p>
          <ButtonGroup segmented>
            {["qualsiasi", "conAnomalie", "senzaAnomalie"].map((value, index) => (
              <Button
                key={index}
                pressed={anomalies === value}
                onClick={() => setAnomalies(value)}
              >
                {{
                  qualsiasi: "Qualsiasi",
                  conAnomalie: "Con anomalie",
                  senzaAnomalie: "Senza anomalie",
                }[value]}
              </Button>
            ))}
          </ButtonGroup>
        </Stack>
      </Stack>
    </Card>
  );
};

export default GeneralSection;
