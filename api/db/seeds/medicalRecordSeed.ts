import type { MedicalRecord } from '~/types/models/medicalRecord';
import { db } from '../database';

export async function seedMedicalRecords() {
  const patients = await db.patients.toArray();

  const sampleRecords: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>[] =
    [];

  // 为每个患者创建入院记录
  patients.forEach((patient) => {
    sampleRecords.push({
      patientId: patient.id as number,
      content: `患者${patient.name}入院。\n主诉：${patient.diagnosis}\n入院评估：患者生命体征平稳，意识清楚。`,
      type: 'ADMISSION',
      doctorName: '张医生'
    });

    // 如果患者已出院，添加出院记录
    if (patient.status === 'DISCHARGED') {
      sampleRecords.push({
        patientId: patient.id as number,
        content: `患者${patient.name}病情好转，达到出院标准。医嘱：按时服药，定期复查。`,
        type: 'DISCHARGE',
        doctorName: '李医生'
      });
    }

    // 随机添加1-3条常规记录
    const regularRecordCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < regularRecordCount; i++) {
      const randomContent = [
        '患者情况稳定，继续观察。',
        '患者反映睡眠改善，appetite良好。',
        '查房：患者各项指标正常，继续当前治疗方案。',
        '患者症状有所缓解，建议继续服药观察。'
      ];

      sampleRecords.push({
        patientId: patient.id as number,
        content:
          randomContent[Math.floor(Math.random() * randomContent.length)],
        type: 'REGULAR',
        doctorName: ['张医生', '李医生', '王医生'][
          Math.floor(Math.random() * 3)
        ]
      });
    }
  });

  // 批量插入记录
  for (const record of sampleRecords) {
    await db.medicalRecords.add({
      ...record,
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      ), // 随机7天内的时间
      updatedAt: new Date()
    });
  }
}
