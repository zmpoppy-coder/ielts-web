import fs from 'fs';
import crypto from 'crypto';

// 生成指定前缀和数量的随机大写兑换码
function generateCodes(prefix, count) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        // 生成 8 位随机字符 (例如: VIP-A1B2C3D4)
        const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(`${prefix}-${randomStr}`);
    }
    return codes;
}

console.log('⏳ 正在生成兑换码...');

// 按照咱们定好的数量生成
const basicCodes = generateCodes('BASIC', 500); // 4.99元体验包
const proCodes = generateCodes('PRO', 100);     // 16.99元进阶包
const vipCodes = generateCodes('VIP', 300);     // 19.99元无限VIP

// ==========================================
// 1. 生成给 Supabase 数据库一键导入用的 CSV 表格
// ==========================================
let csvContent = 'code,plan_type,is_used\n'; // 这是表头，请确保和 Supabase 里的列名一致
basicCodes.forEach(code => csvContent += `${code},basic,FALSE\n`);
proCodes.forEach(code => csvContent += `${code},pro,FALSE\n`);
vipCodes.forEach(code => csvContent += `${code},unlimited,FALSE\n`);

fs.writeFileSync('supabase_import.csv', csvContent);

// ==========================================
// 2. 生成给链动小铺直接复制粘贴用的 TXT 文本
// ==========================================
let txtContent = '【4.99元 体验包 (500个) - 请将下方代码复制到链动小铺】\n' + basicCodes.join('\n') + '\n\n';
txtContent += '【16.99元 进阶包 (100个) - 请将下方代码复制到链动小铺】\n' + proCodes.join('\n') + '\n\n';
txtContent += '【19.99元 VIP包 (300个) - 请将下方代码复制到链动小铺】\n' + vipCodes.join('\n') + '\n';

fs.writeFileSync('liandong_xiaopu_codes.txt', txtContent);

console.log('🎉 生成完毕！');
console.log('👉 请在左侧文件列表查看:');
console.log('   1. supabase_import.csv (用来导入数据库)');
console.log('   2. liandong_xiaopu_codes.txt (用来复制进链动小铺)');