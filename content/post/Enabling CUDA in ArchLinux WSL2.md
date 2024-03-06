# Enabling CUDA in ArchLinux WSL2



~~This article is deprecated, use pure Linux instead~~











##  Troubleshoot

### libcuda cannot link

when using, 

```shell
/sbin/ldconfig.real: Can't link /usr/lib/wsl/lib/libcuda.so.1 to libcuda.so.1.1
```





According to

https://github.com/microsoft/WSL/issues/5548
https://github.com/microsoft/WSL/issues/5663
https://gist.github.com/slavistan/53c8e2627bf9ca202ab6c56ef4d5c497

`/usr/lib/wsl/lib`  is casted from windows and all of them is treated as files. should create a new casting folder:



```
 sudo ln -s /usr/lib/wsl/lib/libcuda.so.1 /usr/local/cuda/lib64/libcuda.so
```



[method 2](https://github.com/microsoft/WSL/issues/5548#issuecomment-990521993):

```shell
echo -e "[automount]\nldconfig = false" | sudo tee -a /etc/wsl.conf

sudo mkdir /usr/lib/wsl/lib2
sudo ln -s /usr/lib/wsl/lib/* /usr/lib/wsl/lib2
echo /usr/lib/wsl/lib2 | sudo tee /etc/ld.so.conf.d/ld.wsl.conf
```



[method 3 (For Windows 11 users)](https://github.com/microsoft/WSL/issues/5548#issuecomment-1225081708):

add the following to `/etc/wsl.conf`:

```shell
[boot]
command = sleep 10 ; mount --bind /usr/lib/wsl/lib /usr/lib/wsl/lib2 -o X-mount.mkdir ; umount /usr/lib/wsl/lib
```

