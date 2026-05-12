# Examples

DSPN has been validated in different domains: healthcare, industry 4.0, agriculture, and mobility. These domains are part of the [EU Common Data Spaces](https://digital-strategy.ec.europa.eu/en/policies/data-spaces) and provide relevant scenarios in which the need to improve the data sharing is fundamental.

The policy view diagrams of these case studies are reported below along with a short description of the data sharing agreement.

## Healthcare

I dati dei pazienti possono essere all'interno di un'ospedale per ragioni amministrative, cliniche, o di ricerca. Questo implica che diversi attori - sia interni che esteni all'organizzazione - possano accedere a tali dati con livelli di visiblità diverse. 
Nello specifico si ipotizza che un collaboratore interno possa accedere ai dati dei pazienti solo in forma anonima attraverso una aggregati per età. Questi dati dovranno essere memorizzati solo all'interno dell'Unione Europea per non più di 6 mesi.
Riguardo ad un collaboratore esterno, appartenente ad una organizzazione con cui l'ospedale ha un accordo di federazione, tutti i dati del paziente potranno essere visibili ma una ricerca massiva non sarà possibile. Infatti è necessario che nella richiesta si specifichi l'id del paziente richiesto

![image](./images/Healthcare/policyView.jpg)

## Industry 4.0

Una impresa manifatturiera con diversi impianti distribuiti sul territorio ha la necessità di integrare i dati provenienti dalla sensoristica installata sui macchinari presenti in tali impianti di produzione. Ipotizzando che ogni impianto offra un data product con i dati esportabili, viene costruiti uno shared data product che offre i risultanti valori dei KPI a specifici attori abilitati alla visualizzazione dei KPI. 

![image](./images/Industry40/policyView.jpg)

## Mobility

In questo scenario si parte dal presupposto che i dati messi a disposizione da parte di un operatore di trasporto locale siano pubblici ma solo in forma aggregata. In questo caso, i dati provenienti da diverse risorse sono integrati per una visione comune senza alcuna policy di autorizzazione in quanti i dati sono liberamente accessibili.

![image](./images/Mobility/policyView.jpg)

## Agriculture

A Vineyard data product represents the information collected from the sensors placed in the vineyards: Areas, which returns aggregated statistics by geographical area; Treatments, which returns the type of treatments provided to vineyards; and vineyard, which returns the data collected by the sensors.

![image](./images/Agriculture/vineyard_policyView.jpg)


[*]The [dspn-file folder](./dspn-files/) contains the XML files that can be read by the dspn-editor. 
