document.addEventListener('DOMContentLoaded', function() {
    // 设置当前域名
    document.getElementById('current-domain').textContent = window.location.hostname;
    document.getElementById('domain').value = window.location.hostname;
    
    // 表单提交
    document.getElementById('sn-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            domain: document.getElementById('domain').value.trim(),
            server_ip: document.getElementById('server_ip').value.trim(),
            user: document.getElementById('user').value.trim(),
            existing_sn: document.getElementById('existing_sn').value.trim()
        };
        
        // 显示加载状态
        const resultContainer = document.getElementById('result-container');
        const snCodeElement = document.getElementById('sn-code');
        resultContainer.style.display = 'block';
        snCodeElement.innerHTML = '<div class="loading">正在生成SN码...</div>';
        
        // 调用后端API
        fetch('https://api.pboot.eu.cc/api/pboot_sn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 显示生成的SN码
                let snCodeHtml = `'sn' => array(<br>`;
                data.sn_codes.forEach(code => {
                    snCodeHtml += `&nbsp;&nbsp;&nbsp;&nbsp;'${code}',<br>`;
                });
                snCodeHtml += `),`;
                
                snCodeElement.innerHTML = snCodeHtml;
                
                // 显示验证因子信息
                let verificationHtml = '';
                if (data.verification_info) {
                    verificationHtml = '<strong>验证因子说明：</strong><ul>';
                    
                    if (data.verification_info.domain_variants && data.verification_info.domain_variants.length > 0) {
                        verificationHtml += '<li><strong>域名验证码：</strong><div class="domain-variants">';
                        data.verification_info.domain_variants.forEach(item => {
                            verificationHtml += `<div class="variant-item">
                                <span class="variant-key">${item.domain}</span>：
                                <strong>${item.code}</strong>
                            </div>`;
                        });
                        verificationHtml += '</div></li>';
                    }
                    
                    if (data.verification_info.ip_code) {
                        verificationHtml += `<li><strong>IP验证码</strong> (${data.verification_info.ip}): ${data.verification_info.ip_code}</li>`;
                    }
                    
                    if (data.verification_info.user_code) {
                        verificationHtml += `<li><strong>用户验证码</strong> (${data.verification_info.user}): ${data.verification_info.user_code}</li>`;
                    }
                    
                    verificationHtml += '</ul>';
                }
                
                document.getElementById('verification-info').innerHTML = verificationHtml;
                
                // 存储数据用于复制功能
                window.currentSnCodes = data.sn_codes;
                window.verificationInfo = data.verification_info;
                
            } else {
                snCodeElement.innerHTML = `<div style="color: #e53e3e;">生成失败: ${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            snCodeElement.innerHTML = '<div style="color: #e53e3e;">连接API失败，请检查网络或API地址配置</div>';
        });
    });
});

function useCurrentDomain() {
    document.getElementById('domain').value = window.location.hostname;
}

function copyToClipboard() {
    if (!window.currentSnCodes) {
        alert('请先生成SN码');
        return;
    }
    
    let text = "'sn' => array(\n";
    window.currentSnCodes.forEach(code => {
        text += `    '${code}',\n`;
    });
    text += "),";
    
    navigator.clipboard.writeText(text)
        .then(() => {
            const btn = document.querySelector('.copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '已复制！';
            btn.style.background = '#48bb78';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        })
        .catch(err => {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            const btn = document.querySelector('.copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '已复制！';
            btn.style.background = '#48bb78';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        });
}
