// import { Form } from 'antd';
// import type { ReactNode, FC } from 'react';
// import { memo } from 'react';

// interface Iprops {
//   children?: ReactNode;
// }
// const ImgItem: FC<Iprops> = () => {
//   return (
//     <Form.Item
//       key={f.name}
//       label={
//         <>
//           {f.label || f.name}
//           {f.required && (
//             <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
//           )}
//         </>
//       }
//       name={f.name}
//       rules={buildRules(f)}
//     >
//       <Upload
//         listType="picture-card"
//         fileList={imageFileLists[f.name] || []}
//         onChange={({ fileList }) =>
//           setImageFileLists((prev) => ({
//             ...prev,
//             [f.name]: fileList,
//           }))
//         }
//         accept="image/*"
//         multiple={false}
//         action={(f as any).uploadUrl || undefined}
//         name="file"
//       >
//         <div>
//           <PlusOutlined />
//           <div style={{ marginTop: 8 }}>上传</div>
//         </div>
//       </Upload>
//     </Form.Item>
//   );
// };
// export default memo(ImgItem);
