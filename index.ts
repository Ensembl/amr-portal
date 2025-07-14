import { getDataProvider } from './data-provider/dataProvider';

const main = async () => {
  const dataProvider = await getDataProvider({ provider: 'local' });

  const antibioticFilters = await dataProvider.getAntibioticFilters();
  console.log('antibioticFilters', antibioticFilters);


  const antibioticNames = ['Cefiderocol', 'Delafloxacin', 'Omadacycline'];
  const records1 = await dataProvider.getBiosamplesByAntibioticNames(antibioticNames);
  console.log('records1', records1);

  const speciesNames = [
    { genus: 'Staphylococcus', species: 'aureus' },
    { genus: 'Enterobacter', species: 'sp' },
    { genus: 'Shigella', species: null }
  ];
  const records2 = await dataProvider.getBiosamplesBySpeciesNames(speciesNames);
  console.log('records2', records2);
}

main();