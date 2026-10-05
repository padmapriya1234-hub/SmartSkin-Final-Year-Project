# Dataset (not included - supply a real one)

Place a real, properly licensed skin-image dataset (e.g. HAM10000, ISIC Archive, DermNet - verify terms) here:

```
dataset/{train,validation,test}/<ClassName>/*.jpg|png|webp
```
- Same class folders in all three splits; folder names become the labels automatically (any number of classes).
- Split by PATIENT/LESION where the dataset provides IDs (HAM10000 has repeated lesions - random image splits leak).
- Run `python analyze_dataset.py` (fails on empty classes, mismatched splits, and identical images across splits),
  then `python train.py`. Do not commit the dataset to git/zip.
